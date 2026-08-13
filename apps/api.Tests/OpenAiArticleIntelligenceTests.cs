using NewsFeed.Api.Ingest;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Tests;

public sealed class OpenAiArticleIntelligenceTests
{
    [Fact]
    public void ParseStoriesJson_ReadsArray()
    {
        var json = """{"stories":[{"headline":"H","summary":"S","category":"Local","citySlug":"jhansi","language":"hi"}]}""";
        var stories = OpenAiArticleIntelligence.ParseStoriesJson(json);
        Assert.Single(stories);
        Assert.Equal("jhansi", stories[0].CitySlug);
    }

    [Fact]
    public void ParseStoriesJson_CoercesUnknownCategoryToLocal()
    {
        var json = """{"stories":[{"headline":"H","summary":"S","category":"Politics","citySlug":"kanpur","language":"en"}]}""";
        var stories = OpenAiArticleIntelligence.ParseStoriesJson(json);
        Assert.Equal("Local", Assert.Single(stories).Category);
    }

    [Fact]
    public void ParseStoriesJson_CanonicalizesCategoryCase()
    {
        var json = """{"stories":[{"headline":"H","summary":"S","category":"sports","citySlug":null,"language":"en"}]}""";
        var stories = OpenAiArticleIntelligence.ParseStoriesJson(json);
        Assert.Equal("Sports", Assert.Single(stories).Category);
    }

    [Fact]
    public void ParseStoriesJson_TruncatesSummaryTo1000()
    {
        var summary = new string('x', 1200);
        var json = $$"""{"stories":[{"headline":"H","summary":"{{summary}}","category":"Health","citySlug":"lucknow","language":"en"}]}""";
        var stories = OpenAiArticleIntelligence.ParseStoriesJson(json);
        Assert.Equal(1000, Assert.Single(stories).Summary.Length);
    }

    [Fact]
    public void ParseStoriesJson_MalformedJson_ReturnsEmpty()
    {
        Assert.Empty(OpenAiArticleIntelligence.ParseStoriesJson("{not-json"));
    }

    [Fact]
    public void ParseSummaryJson_ReadsSummary()
    {
        var summary = OpenAiArticleIntelligence.ParseSummaryJson("""{"summary":"Two-line original wrap-up."}""");
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
    public async Task ExtractStoriesFromImageAsync_SendsDataUrlAndParsesStories()
    {
        string? capturedBody = null;
        var handler = new StubHandler(async request =>
        {
            capturedBody = await request.Content!.ReadAsStringAsync();
            return """
                {"choices":[{"message":{"content":"{\"stories\":[{\"headline\":\"From image\",\"summary\":\"Vision summary.\",\"category\":\"Local\",\"citySlug\":\"jhansi\",\"language\":\"en\"}]}"}}]}
                """;
        });
        var intelligence = new OpenAiArticleIntelligence(
            new NamedHttpClientFactory(OpenAiArticleIntelligence.HttpClientName, new HttpClient(handler)),
            Microsoft.Extensions.Options.Options.Create(new ArticleIntelligenceOptions
            {
                ApiKey = "test-key",
                BaseUrl = "https://api.openai.com/v1",
            }),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<OpenAiArticleIntelligence>.Instance);

        var stories = await intelligence.ExtractStoriesFromImageAsync(
            [0x01, 0x02], "image/png", "jhansi", CancellationToken.None);

        var story = Assert.Single(stories);
        Assert.Equal("From image", story.Headline);
        Assert.Contains("\"image_url\"", capturedBody, StringComparison.Ordinal);
        Assert.Contains("data:image/png;base64,", capturedBody, StringComparison.Ordinal);
        Assert.Contains("IMAGE_UPLOAD", capturedBody, StringComparison.Ordinal);
    }

    private static OpenAiArticleIntelligence CreateSut(string apiKey) =>
        new(
            new UnusedHttpClientFactory(),
            Microsoft.Extensions.Options.Options.Create(new ArticleIntelligenceOptions { ApiKey = apiKey }),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<OpenAiArticleIntelligence>.Instance);

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
        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var body = await responder(request);
            return new HttpResponseMessage(System.Net.HttpStatusCode.OK)
            {
                Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json"),
            };
        }
    }
}
