using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Ingest;

public sealed class OpenAiArticleRewriter(
    IHttpClientFactory httpClientFactory,
    IOptions<OpenAiRewriteOptions> options,
    ILogger<OpenAiArticleRewriter> logger) : IArticleRewriter
{
    public const string HttpClientName = "openai-rewrite";

    private const int MaxInputChars = 8_000;
    private const int MaxSummaryChars = 1000;
    private const int MaxBodyChars = 50_000;
    private const int MaxHeadlineChars = 300;
    private const int MaxTokens = 2048;
    private const int MaxAttempts = 3;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private const string RewriteSystemPrompt =
        """
        You rewrite scraped local news into an original NewsFeed digest for readers aged 40+.
        Reply with JSON only, no markdown: {"headline":string,"summary":string,"body":string}
        Keep the same language as the source. Preserve facts, names, places, and numbers.
        Do not copy the source verbatim. Do not include HTML.
        headline is a clear, short title.
        summary is 2-4 original sentences for the feed card.
        body is a few short plain-text paragraphs for in-app reading (digest, not a full reprint).
        """;

    public async Task<RewrittenArticle?> RewriteScrapedArticleAsync(
        string headline,
        string bodyOrSnippet,
        string citySlug,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(options.Value.ApiKey))
        {
            return null;
        }

        var body = HtmlText.Truncate(bodyOrSnippet ?? "", MaxInputChars);
        var userContent =
            $"City slug: {citySlug}\nHeadline: {headline}\n---\n{body}";

        try
        {
            var content = await CompleteJsonAsync(RewriteSystemPrompt, userContent, cancellationToken);
            return ParseRewriteJson(content, fallbackHeadline: headline);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "OpenAI scrape rewrite failed for city {CitySlug}", citySlug);
            return null;
        }
    }

    public static RewrittenArticle? ParseRewriteJson(string json, string? fallbackHeadline = null)
    {
        json = StripMarkdownFence(json);
        try
        {
            var parsed = JsonSerializer.Deserialize<RewriteEnvelope>(json, JsonOptions);
            var headline = parsed?.Headline?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(headline))
            {
                headline = fallbackHeadline?.Trim() ?? "";
            }

            var summary = parsed?.Summary?.Trim() ?? "";
            var body = parsed?.Body?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(headline)
                || string.IsNullOrWhiteSpace(summary)
                || string.IsNullOrWhiteSpace(body))
            {
                return null;
            }

            return new RewrittenArticle(
                HtmlText.Truncate(headline, MaxHeadlineChars),
                HtmlText.Truncate(summary, MaxSummaryChars),
                HtmlText.Truncate(body, MaxBodyChars));
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private async Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userContent,
        CancellationToken cancellationToken)
    {
        var settings = options.Value;
        var url = $"{settings.BaseUrl.TrimEnd('/')}/chat/completions";
        var payload = new ChatCompletionsRequest(
            settings.Model,
            [
                new ChatMessage("system", systemPrompt),
                new ChatMessage("user", userContent),
            ],
            MaxTokens,
            new ResponseFormat("json_object"));

        var client = httpClientFactory.CreateClient(HttpClientName);
        for (var attempt = 1; attempt <= MaxAttempts; attempt++)
        {
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Post, url);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", settings.ApiKey);
                request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                request.Content = new StringContent(
                    JsonSerializer.Serialize(payload, JsonOptions),
                    Encoding.UTF8,
                    "application/json");

                using var response = await client.SendAsync(request, cancellationToken);
                var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    return ReadAssistantText(responseBody);
                }

                logger.LogWarning(
                    "OpenAI rewrite request failed with status {StatusCode}",
                    (int)response.StatusCode);
                if (attempt < MaxAttempts && IsTransient((int)response.StatusCode))
                {
                    await Task.Delay(TimeSpan.FromMilliseconds(300 * attempt), cancellationToken);
                    continue;
                }

                throw new InvalidOperationException(
                    $"OpenAI rewrite request failed with status {(int)response.StatusCode}.");
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

        throw new InvalidOperationException("OpenAI rewrite request failed.");
    }

    private static bool IsTransient(int statusCode) =>
        statusCode is 408 or 429 || statusCode >= 500;

    private static string ReadAssistantText(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            var choices = doc.RootElement.GetProperty("choices");
            foreach (var choice in choices.EnumerateArray())
            {
                if (choice.TryGetProperty("message", out var message)
                    && message.TryGetProperty("content", out var content))
                {
                    return content.GetString() ?? "";
                }
            }

            throw new InvalidOperationException("OpenAI response had no assistant message.");
        }
        catch (Exception ex) when (ex is JsonException or InvalidOperationException or KeyNotFoundException)
        {
            throw new InvalidOperationException("OpenAI response was missing chat completion text.", ex);
        }
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

    private sealed record RewriteEnvelope(string? Headline, string? Summary, string? Body);

    private sealed record ChatCompletionsRequest(
        string Model,
        IReadOnlyList<ChatMessage> Messages,
        [property: JsonPropertyName("max_tokens")] int MaxTokens,
        [property: JsonPropertyName("response_format")] ResponseFormat ResponseFormat);

    private sealed record ChatMessage(string Role, string Content);

    private sealed record ResponseFormat(string Type);
}
