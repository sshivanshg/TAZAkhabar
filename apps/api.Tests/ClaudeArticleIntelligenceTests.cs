using NewsFeed.Api.Ingest;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Tests;

public sealed class ClaudeArticleIntelligenceTests
{
    [Fact]
    public void ParseStoriesJson_ReadsArray()
    {
        var json = """{"stories":[{"headline":"H","summary":"S","category":"Local","citySlug":"jhansi","language":"hi"}]}""";
        var stories = ClaudeArticleIntelligence.ParseStoriesJson(json);
        Assert.Single(stories);
        Assert.Equal("jhansi", stories[0].CitySlug);
    }

    [Fact]
    public void ParseStoriesJson_CoercesUnknownCategoryToLocal()
    {
        var json = """{"stories":[{"headline":"H","summary":"S","category":"Politics","citySlug":"kanpur","language":"en"}]}""";
        var stories = ClaudeArticleIntelligence.ParseStoriesJson(json);
        Assert.Equal("Local", Assert.Single(stories).Category);
    }

    [Fact]
    public void ParseStoriesJson_CanonicalizesCategoryCase()
    {
        var json = """{"stories":[{"headline":"H","summary":"S","category":"sports","citySlug":null,"language":"en"}]}""";
        var stories = ClaudeArticleIntelligence.ParseStoriesJson(json);
        Assert.Equal("Sports", Assert.Single(stories).Category);
    }

    [Fact]
    public void ParseStoriesJson_TruncatesSummaryTo1000()
    {
        var summary = new string('x', 1200);
        var json = $$"""{"stories":[{"headline":"H","summary":"{{summary}}","category":"Health","citySlug":"lucknow","language":"en"}]}""";
        var stories = ClaudeArticleIntelligence.ParseStoriesJson(json);
        Assert.Equal(1000, Assert.Single(stories).Summary.Length);
    }

    [Fact]
    public void ParseStoriesJson_MalformedJson_ReturnsEmpty()
    {
        Assert.Empty(ClaudeArticleIntelligence.ParseStoriesJson("{not-json"));
    }

    [Fact]
    public void ParseSummaryJson_ReadsSummary()
    {
        var summary = ClaudeArticleIntelligence.ParseSummaryJson("""{"summary":"Two-line original wrap-up."}""");
        Assert.Equal("Two-line original wrap-up.", summary);
    }

    [Fact]
    public async Task ExtractStoriesAsync_MissingApiKey_Throws()
    {
        var intelligence = CreateSut(apiKey: "");
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            intelligence.ExtractStoriesAsync("plain text", "jhansi", CancellationToken.None));
    }

    [Fact]
    public async Task SummarizeArticleAsync_MissingApiKey_Throws()
    {
        var intelligence = CreateSut(apiKey: "");
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            intelligence.SummarizeArticleAsync("Headline", "Body", "jhansi", CancellationToken.None));
    }

    [Fact]
    public async Task ExtractStoriesFromImageAsync_MissingApiKey_Throws()
    {
        var intelligence = CreateSut(apiKey: "");
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            intelligence.ExtractStoriesFromImageAsync([0xFF, 0xD8, 0xFF, 0xD9], "image/jpeg", "jhansi", CancellationToken.None));
    }

    [Fact]
    public async Task ExtractStoriesFromImageAsync_SendsAnthropicImageAndParsesStories()
    {
        string? capturedBody = null;
        string? apiKeyHeader = null;
        string? versionHeader = null;
        var handler = new StubHandler(async request =>
        {
            capturedBody = await request.Content!.ReadAsStringAsync();
            apiKeyHeader = request.Headers.TryGetValues("x-api-key", out var keys) ? keys.FirstOrDefault() : null;
            versionHeader = request.Headers.TryGetValues("anthropic-version", out var versions)
                ? versions.FirstOrDefault()
                : null;
            return """
                {"content":[{"type":"text","text":"{\"stories\":[{\"headline\":\"From image\",\"summary\":\"Vision summary.\",\"category\":\"Local\",\"citySlug\":\"jhansi\",\"language\":\"en\"}]}"}]}
                """;
        });
        var intelligence = new ClaudeArticleIntelligence(
            new NamedHttpClientFactory(ClaudeArticleIntelligence.HttpClientName, new HttpClient(handler)),
            Microsoft.Extensions.Options.Options.Create(new ArticleIntelligenceOptions
            {
                ApiKey = "test-key",
                BaseUrl = "https://api.anthropic.com",
                Model = "claude-sonnet-4-5",
            }),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<ClaudeArticleIntelligence>.Instance);

        var stories = await intelligence.ExtractStoriesFromImageAsync(
            [0x01, 0x02], "image/png", "jhansi", CancellationToken.None);

        var story = Assert.Single(stories);
        Assert.Equal("From image", story.Headline);
        Assert.Equal("test-key", apiKeyHeader);
        Assert.Equal(ClaudeArticleIntelligence.AnthropicVersion, versionHeader);
        Assert.Contains("\"type\":\"image\"", capturedBody, StringComparison.Ordinal);
        Assert.Contains("\"media_type\":\"image/png\"", capturedBody, StringComparison.Ordinal);
        Assert.Contains("IMAGE_UPLOAD", capturedBody, StringComparison.Ordinal);
        Assert.Contains("/v1/messages", handler.LastRequestUri, StringComparison.Ordinal);
    }

    private static ClaudeArticleIntelligence CreateSut(string apiKey) =>
        new(
            new UnusedHttpClientFactory(),
            Microsoft.Extensions.Options.Options.Create(new ArticleIntelligenceOptions { ApiKey = apiKey }),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<ClaudeArticleIntelligence>.Instance);

    private sealed class UnusedHttpClientFactory : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) =>
            throw new InvalidOperationException("HTTP should not be used when the API key is missing.");
    }

    private sealed class NamedHttpClientFactory(string expectedName, HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name)
        {
            Assert.Equal(expectedName, name);
            return client;
        }
    }

    private sealed class StubHandler(Func<HttpRequestMessage, Task<string>> responder) : HttpMessageHandler
    {
        public string LastRequestUri { get; private set; } = "";

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequestUri = request.RequestUri?.ToString() ?? "";
            var body = await responder(request);
            return new HttpResponseMessage(System.Net.HttpStatusCode.OK)
            {
                Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json"),
            };
        }
    }
}
