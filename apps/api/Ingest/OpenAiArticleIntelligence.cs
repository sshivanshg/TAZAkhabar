using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Ingest;

public sealed class OpenAiArticleIntelligence(
    IHttpClientFactory httpClientFactory,
    IOptions<ArticleIntelligenceOptions> options,
    ILogger<OpenAiArticleIntelligence> logger) : IArticleIntelligence
{
    public const string HttpClientName = "article-intelligence";

    private const int MaxInputChars = 24_000;
    private const int MaxSummaryChars = 1000;

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
            var language = string.IsNullOrWhiteSpace(item.Language) ? "en" : item.Language.Trim();

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

    private async Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userContent,
        CancellationToken cancellationToken)
    {
        var settings = options.Value;
        var url = $"{settings.BaseUrl.TrimEnd('/')}/chat/completions";
        var payload = new ChatCompletionRequest(
            settings.Model,
            [
                new ChatMessage("system", systemPrompt),
                new ChatMessage("user", userContent),
            ],
            new ResponseFormat("json_object"));

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", settings.ApiKey);
        request.Content = new StringContent(
            JsonSerializer.Serialize(payload, JsonOptions),
            Encoding.UTF8,
            "application/json");

        var client = httpClientFactory.CreateClient(HttpClientName);
        using var response = await client.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning(
                "Article intelligence request failed with status {StatusCode}",
                (int)response.StatusCode);
            throw new InvalidOperationException(
                $"Article intelligence request failed with status {(int)response.StatusCode}.");
        }

        return ReadMessageContent(body);
    }

    private static string ReadMessageContent(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            var content = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            return content ?? "";
        }
        catch (Exception ex) when (ex is JsonException or InvalidOperationException or KeyNotFoundException or IndexOutOfRangeException)
        {
            throw new InvalidOperationException("Article intelligence response was missing chat content.", ex);
        }
    }

    private void EnsureApiKey()
    {
        if (string.IsNullOrWhiteSpace(options.Value.ApiKey))
        {
            throw new InvalidOperationException(
                "ArticleIntelligence:ApiKey is missing. Set ArticleIntelligence__ApiKey to enable PDF and scrape intelligence.");
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

    private sealed record ChatCompletionRequest(
        string Model,
        IReadOnlyList<ChatMessage> Messages,
        [property: JsonPropertyName("response_format")] ResponseFormat ResponseFormat);

    private sealed record ChatMessage(string Role, string Content);

    private sealed record ResponseFormat(string Type);
}
