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
}
