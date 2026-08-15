using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Ingest;

public sealed class ClaudeArticleIntelligence(
    IHttpClientFactory httpClientFactory,
    IOptions<ArticleIntelligenceOptions> options,
    ILogger<ClaudeArticleIntelligence> logger) : IArticleIntelligence
{
    public const string HttpClientName = "article-intelligence";
    public const string AnthropicVersion = "2023-06-01";

    private const int MaxInputChars = 24_000;
    private const int MaxSummaryChars = 1000;
    private const int MaxTokens = 4096;
    private const int MaxAttempts = 3;

    private static readonly string[] AllowedCategories =
        ["Local", "State", "National", "Business", "Health", "Sports"];

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private const string ExtractStoriesSystemPrompt =
        """
        You extract news stories from newspaper or clipping text.
        Reply with JSON only, no markdown: {"stories":[{"headline":string,"summary":string,"category":string,"citySlug":string|null,"language":string}]}
        category must be one of: Local, State, National, Business, Health, Sports.
        language is "hi" or "en".
        summary is 2-4 original sentences, not a verbatim copy.
        Drop ads, classifieds, and masthead junk.
        If a city hint slug is given, prefer that citySlug unless the story is clearly elsewhere.
        """;

    private const string SummarizeSystemPrompt =
        """
        Write a short original 2-4 line news summary in the same language as the article.
        Reply with JSON only, no markdown: {"summary":"..."}
        Do not copy the source verbatim.
        """;

    private const string TranslateSystemPrompt =
        """
        You translate news headlines and short summaries for a local news reader.
        Reply with JSON only, no markdown: {"headline":"...","summary":"..."}
        Preserve meaning, names, and numbers. Keep the same journalistic tone.
        Do not add commentary or explain the translation.
        """;

    public async Task<IReadOnlyList<ExtractedStory>> ExtractStoriesAsync(
        string plainText,
        string? cityHintSlug,
        CancellationToken cancellationToken)
    {
        EnsureApiKey();

        var truncated = HtmlText.Truncate(plainText ?? "", MaxInputChars);
        var hint = string.IsNullOrWhiteSpace(cityHintSlug) ? "(none)" : cityHintSlug.Trim();
        var userContent = $"City hint slug: {hint}\n---\n{truncated}";

        var content = await CompleteJsonAsync(ExtractStoriesSystemPrompt, userContent, cancellationToken);
        return ParseStoriesJson(content);
    }

    public async Task<IReadOnlyList<ExtractedStory>> ExtractStoriesFromImageAsync(
        byte[] imageBytes,
        string contentType,
        string? cityHintSlug,
        CancellationToken cancellationToken)
    {
        EnsureApiKey();

        var hint = string.IsNullOrWhiteSpace(cityHintSlug) ? "(none)" : cityHintSlug.Trim();
        var userText = $"City hint slug: {hint}\nIMAGE_UPLOAD";
        var mime = NormalizeImageMime(contentType);
        var content = await CompleteVisionJsonAsync(
            ExtractStoriesSystemPrompt, userText, imageBytes, mime, cancellationToken);
        return ParseStoriesJson(content);
    }

    public async Task<string> SummarizeArticleAsync(
        string headline,
        string bodyOrSnippet,
        string citySlug,
        CancellationToken cancellationToken)
    {
        EnsureApiKey();

        var body = HtmlText.Truncate(bodyOrSnippet ?? "", MaxInputChars);
        var userContent = $"City slug: {citySlug}\nHeadline: {headline}\n---\n{body}";

        var content = await CompleteJsonAsync(SummarizeSystemPrompt, userContent, cancellationToken);
        return ParseSummaryJson(content);
    }

    public async Task<(string Headline, string Summary)?> TranslateArticleAsync(
        string headline,
        string summary,
        string sourceLanguage,
        string targetLanguage,
        CancellationToken cancellationToken)
    {
        EnsureApiKey();

        var src = ArticleLanguageDetector.Normalize(sourceLanguage) ?? ArticleLanguageDetector.DefaultLanguage;
        var tgt = ArticleLanguageDetector.Normalize(targetLanguage) ?? ArticleLanguageDetector.DefaultLanguage;
        if (string.Equals(src, tgt, StringComparison.Ordinal))
        {
            return (headline, summary);
        }

        var userContent =
            $"Source language: {src}\nTarget language: {tgt}\nHeadline: {headline}\nSummary: {summary}";
        var content = await CompleteJsonAsync(TranslateSystemPrompt, userContent, cancellationToken);
        return ParseTranslationJson(content);
    }

    public static IReadOnlyList<ExtractedStory> ParseStoriesJson(string json)
    {
        json = StripMarkdownFence(json);
        StoriesEnvelope? envelope;
        try
        {
            envelope = JsonSerializer.Deserialize<StoriesEnvelope>(json, JsonOptions);
        }
        catch (JsonException)
        {
            return [];
        }

        if (envelope?.Stories is null)
        {
            return [];
        }

        var stories = new List<ExtractedStory>();
        foreach (var item in envelope.Stories)
        {
            var headline = item.Headline?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(headline))
            {
                continue;
            }

            var citySlug = string.IsNullOrWhiteSpace(item.CitySlug) ? null : item.CitySlug.Trim();
            var language = ArticleLanguageDetector.Normalize(item.Language)
                ?? ArticleLanguageDetector.DefaultLanguage;

            stories.Add(new ExtractedStory(
                Headline: HtmlText.Truncate(headline, 300),
                Summary: HtmlText.Truncate(item.Summary ?? "", MaxSummaryChars),
                Category: CoerceCategory(item.Category),
                CitySlug: citySlug,
                Language: language));
        }

        return stories;
    }

    public static string ParseSummaryJson(string json)
    {
        json = StripMarkdownFence(json);
        try
        {
            var parsed = JsonSerializer.Deserialize<SummaryEnvelope>(json, JsonOptions);
            return HtmlText.Truncate(parsed?.Summary?.Trim() ?? "", MaxSummaryChars);
        }
        catch (JsonException)
        {
            return "";
        }
    }

    public static (string Headline, string Summary)? ParseTranslationJson(string json)
    {
        json = StripMarkdownFence(json);
        try
        {
            var parsed = JsonSerializer.Deserialize<TranslationEnvelope>(json, JsonOptions);
            var headline = parsed?.Headline?.Trim() ?? "";
            var summary = parsed?.Summary?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(headline) || string.IsNullOrWhiteSpace(summary))
            {
                return null;
            }

            return (
                HtmlText.Truncate(headline, 300),
                HtmlText.Truncate(summary, MaxSummaryChars));
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userContent,
        CancellationToken cancellationToken)
    {
        return SendMessagesAsync(
            systemPrompt,
            [new UserContentBlock("text", userContent, null)],
            cancellationToken);
    }

    private Task<string> CompleteVisionJsonAsync(
        string systemPrompt,
        string userText,
        byte[] imageBytes,
        string mime,
        CancellationToken cancellationToken)
    {
        return SendMessagesAsync(
            systemPrompt,
            [
                new UserContentBlock(
                    "image",
                    null,
                    new ImageSource("base64", mime, Convert.ToBase64String(imageBytes))),
                new UserContentBlock("text", userText, null),
            ],
            cancellationToken);
    }

    private async Task<string> SendMessagesAsync(
        string systemPrompt,
        IReadOnlyList<UserContentBlock> userBlocks,
        CancellationToken cancellationToken)
    {
        var settings = options.Value;
        var url = $"{settings.BaseUrl.TrimEnd('/')}/v1/messages";
        var payload = new MessagesRequest(
            settings.Model,
            MaxTokens,
            systemPrompt,
            [new Message("user", userBlocks)]);

        var client = httpClientFactory.CreateClient(HttpClientName);
        for (var attempt = 1; attempt <= MaxAttempts; attempt++)
        {
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Post, url);
                request.Headers.TryAddWithoutValidation("x-api-key", settings.ApiKey);
                request.Headers.TryAddWithoutValidation("anthropic-version", AnthropicVersion);
                request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                request.Content = new StringContent(
                    JsonSerializer.Serialize(payload, JsonOptions),
                    Encoding.UTF8,
                    "application/json");

                using var response = await client.SendAsync(request, cancellationToken);
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    return ReadMessageText(body);
                }

                logger.LogWarning(
                    "Article intelligence request failed with status {StatusCode}",
                    (int)response.StatusCode);
                if (attempt < MaxAttempts && IsTransient((int)response.StatusCode))
                {
                    await Task.Delay(TimeSpan.FromMilliseconds(300 * attempt), cancellationToken);
                    continue;
                }

                throw new InvalidOperationException(
                    $"Article intelligence request failed with status {(int)response.StatusCode}.");
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (HttpRequestException) when (attempt < MaxAttempts)
            {
                await Task.Delay(TimeSpan.FromMilliseconds(300 * attempt), cancellationToken);
            }
        }

        throw new InvalidOperationException("Article intelligence request failed.");
    }

    private static bool IsTransient(int statusCode) =>
        statusCode is 408 or 429 || statusCode >= 500;

    private static string NormalizeImageMime(string? contentType)
    {
        var mime = (contentType ?? "").Split(';')[0].Trim().ToLowerInvariant();
        return mime switch
        {
            "image/jpg" => "image/jpeg",
            "image/jpeg" or "image/png" or "image/webp" => mime,
            _ => "image/jpeg",
        };
    }

    private static string ReadMessageText(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            var content = doc.RootElement.GetProperty("content");
            foreach (var block in content.EnumerateArray())
            {
                if (block.TryGetProperty("type", out var type)
                    && type.GetString() == "text"
                    && block.TryGetProperty("text", out var text))
                {
                    return text.GetString() ?? "";
                }
            }

            throw new InvalidOperationException("Article intelligence response had no text block.");
        }
        catch (Exception ex) when (ex is JsonException or InvalidOperationException or KeyNotFoundException)
        {
            throw new InvalidOperationException("Article intelligence response was missing Claude message text.", ex);
        }
    }

    private void EnsureApiKey()
    {
        if (string.IsNullOrWhiteSpace(options.Value.ApiKey))
        {
            throw new InvalidOperationException(
                "ArticleIntelligence:ApiKey is missing. Set ArticleIntelligence__ApiKey to your Claude (Anthropic) API key.");
        }
    }

    private static string CoerceCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category))
        {
            return "Local";
        }

        var trimmed = category.Trim();
        foreach (var allowed in AllowedCategories)
        {
            if (string.Equals(allowed, trimmed, StringComparison.OrdinalIgnoreCase))
            {
                return allowed;
            }
        }

        return "Local";
    }

    private static string StripMarkdownFence(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return "";
        }

        var trimmed = json.Trim();
        if (!trimmed.StartsWith("```", StringComparison.Ordinal))
        {
            return trimmed;
        }

        var firstNewline = trimmed.IndexOf('\n');
        if (firstNewline < 0)
        {
            return trimmed;
        }

        trimmed = trimmed[(firstNewline + 1)..];
        var fence = trimmed.LastIndexOf("```", StringComparison.Ordinal);
        if (fence >= 0)
        {
            trimmed = trimmed[..fence];
        }

        return trimmed.Trim();
    }

    private sealed record StoriesEnvelope(List<StoryJson>? Stories);

    private sealed record StoryJson(
        string? Headline,
        string? Summary,
        string? Category,
        string? CitySlug,
        string? Language);

    private sealed record SummaryEnvelope(string? Summary);

    private sealed record TranslationEnvelope(string? Headline, string? Summary);

    private sealed record MessagesRequest(
        string Model,
        [property: JsonPropertyName("max_tokens")] int MaxTokens,
        string System,
        IReadOnlyList<Message> Messages);

    private sealed record Message(string Role, IReadOnlyList<UserContentBlock> Content);

    private sealed record UserContentBlock(
        string Type,
        string? Text,
        ImageSource? Source);

    private sealed record ImageSource(
        string Type,
        [property: JsonPropertyName("media_type")] string MediaType,
        string Data);
}
