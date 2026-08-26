using System.Net;
using System.Text;
using Microsoft.Extensions.Logging.Abstractions;
using NewsFeed.Api.Ingest;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Tests;

public sealed class OpenAiArticleRewriterTests
{
    [Fact]
    public void ParseRewriteJson_ReturnsRewrittenArticle()
    {
        var parsed = OpenAiArticleRewriter.ParseRewriteJson(
            """{"headline":"Clean title","summary":"Two-line wrap-up.","body":"Paragraph one.\n\nParagraph two."}""");

        Assert.NotNull(parsed);
        Assert.Equal("Clean title", parsed!.Headline);
        Assert.Equal("Two-line wrap-up.", parsed.Summary);
        Assert.Equal("Paragraph one.\n\nParagraph two.", parsed.Body);
    }

    [Fact]
    public void ParseRewriteJson_UsesFallbackHeadline_WhenMissing()
    {
        var parsed = OpenAiArticleRewriter.ParseRewriteJson(
            """{"headline":"","summary":"Summary text.","body":"Body text."}""",
            fallbackHeadline: "Extracted title");

        Assert.NotNull(parsed);
        Assert.Equal("Extracted title", parsed!.Headline);
    }

    [Fact]
    public void ParseRewriteJson_ReturnsNull_ForInvalidOrIncompleteJson()
    {
        Assert.Null(OpenAiArticleRewriter.ParseRewriteJson("{not-json"));
        Assert.Null(OpenAiArticleRewriter.ParseRewriteJson(
            """{"headline":"Only title","summary":"","body":"Body"}"""));
    }

    [Fact]
    public async Task RewriteScrapedArticleAsync_ReturnsNull_WhenApiKeyMissing()
    {
        var rewriter = new OpenAiArticleRewriter(
            new UnusedHttpClientFactory(),
            Microsoft.Extensions.Options.Options.Create(new OpenAiRewriteOptions { ApiKey = "" }),
            NullLogger<OpenAiArticleRewriter>.Instance);

        var result = await rewriter.RewriteScrapedArticleAsync(
            "Title",
            "Body text",
            "jhansi",
            CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task RewriteScrapedArticleAsync_SendsChatCompletionsJsonObject()
    {
        string? capturedBody = null;
        string? authHeader = null;
        var handler = new StubHandler(async request =>
        {
            capturedBody = await request.Content!.ReadAsStringAsync();
            authHeader = request.Headers.Authorization?.ToString();
            return """
                {"choices":[{"message":{"content":"{\"headline\":\"Rewritten title\",\"summary\":\"Digest summary.\",\"body\":\"Digest body.\"}"}}]}
                """;
        });
        var rewriter = new OpenAiArticleRewriter(
            new NamedHttpClientFactory(OpenAiArticleRewriter.HttpClientName, new HttpClient(handler)),
            Microsoft.Extensions.Options.Options.Create(new OpenAiRewriteOptions
            {
                ApiKey = "test-openai-key",
                BaseUrl = "https://api.openai.com/v1",
                Model = "gpt-4o-mini",
            }),
            NullLogger<OpenAiArticleRewriter>.Instance);

        var result = await rewriter.RewriteScrapedArticleAsync(
            "Original title",
            "Scraped body text",
            "jhansi",
            CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Rewritten title", result!.Headline);
        Assert.Equal("Digest summary.", result.Summary);
        Assert.Equal("Digest body.", result.Body);
        Assert.Equal("Bearer test-openai-key", authHeader);
        Assert.Contains("/chat/completions", handler.LastRequestUri, StringComparison.Ordinal);
        Assert.Contains("\"response_format\":{\"type\":\"json_object\"}", capturedBody, StringComparison.Ordinal);
        Assert.Contains("gpt-4o-mini", capturedBody, StringComparison.Ordinal);
        Assert.Contains("Original title", capturedBody, StringComparison.Ordinal);
        Assert.Contains("Scraped body text", capturedBody, StringComparison.Ordinal);
    }

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
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            LastRequestUri = request.RequestUri?.ToString() ?? "";
            var body = await responder(request);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json"),
            };
        }
    }
}
