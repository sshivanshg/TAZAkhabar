using System.Net;
using System.Net.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http;
using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class ScrapeHttpClientTests : IClassFixture<NewsFeedWebApplicationFactory>
{
    private readonly NewsFeedWebApplicationFactory _factory;

    public ScrapeHttpClientTests(NewsFeedWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public void NamedScrapeClient_DisablesAutoRedirect()
    {
        _factory.CreateSeededClient();
        var handlerFactory = _factory.Services.GetRequiredService<IHttpMessageHandlerFactory>();
        using var handler = handlerFactory.CreateHandler(ScrapeHttpClient.HttpClientName);
        var primary = Unwrap(handler);
        if (primary is SocketsHttpHandler sockets)
        {
            Assert.False(sockets.AllowAutoRedirect);
            return;
        }

        if (primary is HttpClientHandler http)
        {
            Assert.False(http.AllowAutoRedirect);
            return;
        }

        Assert.Fail($"Unexpected primary handler {primary.GetType().FullName}.");
    }

    [Fact]
    public async Task GetStringAsync_DoesNotFollowRedirect()
    {
        var requests = new List<Uri?>();
        var redirectTarget = new Uri("https://example.com/private");
        var handler = new RecordingHandler(request =>
        {
            requests.Add(request.RequestUri);
            return new HttpResponseMessage(HttpStatusCode.Found)
            {
                Headers = { Location = redirectTarget },
            };
        });
        var scrape = new ScrapeHttpClient(
            new NamedHttpClientFactory(ScrapeHttpClient.HttpClientName, new HttpClient(handler)));

        var ex = await Assert.ThrowsAsync<HttpRequestException>(() =>
            scrape.GetStringAsync(new Uri("https://www.amarujala.com/city"), CancellationToken.None));

        Assert.Contains("redirect", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("302", ex.Message, StringComparison.Ordinal);
        Assert.Single(requests);
        Assert.Equal("https://www.amarujala.com/city", requests[0]!.AbsoluteUri);
        Assert.DoesNotContain(redirectTarget, requests);
    }

    private static HttpMessageHandler Unwrap(HttpMessageHandler handler)
    {
        while (handler is DelegatingHandler delegating && delegating.InnerHandler is not null)
        {
            handler = delegating.InnerHandler;
        }

        return handler;
    }

    private sealed class NamedHttpClientFactory(string expectedName, HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name)
        {
            Assert.Equal(expectedName, name);
            return client;
        }
    }

    private sealed class RecordingHandler(Func<HttpRequestMessage, HttpResponseMessage> responder) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(responder(request));
    }
}
