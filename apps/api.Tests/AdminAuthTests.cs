using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using NewsFeed.Api.Dtos;

namespace NewsFeed.Api.Tests;

public sealed class AdminAuthTests : IClassFixture<TazaKhabarWebApplicationFactory>
{
    private static readonly ConcurrentDictionary<(TazaKhabarWebApplicationFactory Factory, string Name), string> Tokens = new();

    private readonly TazaKhabarWebApplicationFactory _factory;

    public AdminAuthTests(TazaKhabarWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsToken()
    {
        var client = _factory.CreateSeededClient();
        var response = await client.PostAsJsonAsync("/api/admin/login", new
        {
            password = TazaKhabarWebApplicationFactory.TestAdminPassword,
            displayName = "Ada",
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<AdminLoginResponse>();
        Assert.False(string.IsNullOrWhiteSpace(body!.Token));
        Assert.True(body.ExpiresAt > DateTimeOffset.UtcNow);
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        var client = _factory.CreateSeededClient();
        var response = await client.PostAsJsonAsync("/api/admin/login", new
        {
            password = "nope",
            displayName = "Ada",
        });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_BlankDisplayName_Returns400()
    {
        var client = _factory.CreateSeededClient();
        var response = await client.PostAsJsonAsync("/api/admin/login", new
        {
            password = TazaKhabarWebApplicationFactory.TestAdminPassword,
            displayName = "   ",
        });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_DisplayNameTooLong_Returns400()
    {
        var client = _factory.CreateSeededClient();
        var response = await client.PostAsJsonAsync("/api/admin/login", new
        {
            password = TazaKhabarWebApplicationFactory.TestAdminPassword,
            displayName = new string('x', 81),
        });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AdminArticles_WithoutBearer_Returns401()
    {
        var client = _factory.CreateSeededClient();
        var response = await client.GetAsync("/api/admin/articles");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AdminArticles_IngestKey_NotAccepted()
    {
        var client = _factory.CreateSeededClient();
        client.DefaultRequestHeaders.Add("X-Ingest-Key", TazaKhabarWebApplicationFactory.TestIngestKey);
        var response = await client.GetAsync("/api/admin/articles");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    public static async Task<HttpClient> CreateAuthedClientAsync(
        TazaKhabarWebApplicationFactory factory,
        string displayName = "Ada")
    {
        var client = factory.CreateSeededClient();
        var cacheKey = (factory, displayName);
        if (!Tokens.TryGetValue(cacheKey, out var token))
        {
            var login = await client.PostAsJsonAsync("/api/admin/login", new
            {
                password = TazaKhabarWebApplicationFactory.TestAdminPassword,
                displayName,
            });
            login.EnsureSuccessStatusCode();
            var body = await login.Content.ReadFromJsonAsync<AdminLoginResponse>();
            token = body!.Token;
            Tokens[cacheKey] = token;
        }

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }
}
