using System.Net;
using System.Net.Http.Json;
using NewsFeed.Api.Dtos;

namespace NewsFeed.Api.Tests;

public sealed class HealthEndpointTests : IClassFixture<TazaKhabarWebApplicationFactory>
{
    private readonly TazaKhabarWebApplicationFactory _factory;

    public HealthEndpointTests(TazaKhabarWebApplicationFactory factory)
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
        Assert.Equal("tazakhabar-api", payload.Service);
        Assert.Equal("up", payload.Database);
    }
}
