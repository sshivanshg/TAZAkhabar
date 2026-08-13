using System.Net;
using System.Net.Http.Json;
using NewsFeed.Api.Dtos;

namespace NewsFeed.Api.Tests;

public sealed class HealthEndpointTests : IClassFixture<NewsFeedWebApplicationFactory>
{
    private readonly NewsFeedWebApplicationFactory _factory;

    public HealthEndpointTests(NewsFeedWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetHealth_ReturnsOk_WithHealthyPayload()
    {
        var client = _factory.CreateSeededClient();
        var response = await client.GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<HealthResponse>();
        Assert.NotNull(payload);
        Assert.Equal("healthy", payload.Status);
        Assert.Equal("newsfeed-api", payload.Service);
        Assert.Equal("up", payload.Database);
    }
}
