using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;

namespace NewsFeed.Api.Tests;

public sealed class ExceptionHandlingTests : IClassFixture<TazaKhabarWebApplicationFactory>
{
    private readonly TazaKhabarWebApplicationFactory _factory;

    public ExceptionHandlingTests(TazaKhabarWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task UnhandledException_ReturnsGenericProblemDetails()
    {
        var client = _factory.CreateSeededClient();

        var response = await client.GetAsync("/api/test/unhandled-exception");

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(TestJson.Options);
        Assert.NotNull(problem);
        Assert.Equal(500, problem!.Status);
        Assert.Equal("An unexpected error occurred.", problem.Title);
        var raw = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("Sensitive test exception detail", raw, StringComparison.Ordinal);
        Assert.DoesNotContain("InvalidOperationException", raw, StringComparison.Ordinal);
        Assert.DoesNotContain("StackTrace", raw, StringComparison.OrdinalIgnoreCase);
    }
}
