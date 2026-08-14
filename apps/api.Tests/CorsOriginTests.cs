namespace NewsFeed.Api.Tests;

public sealed class CorsOriginTests
{
    private static readonly string[] Configured =
    [
        "https://newsfeed-web.pages.dev",
        "https://newsfeed-admin.pages.dev",
    ];

    [Theory]
    [InlineData("https://newsfeed-web.pages.dev")]
    [InlineData("https://newsfeed-admin.pages.dev")]
    [InlineData("https://main.newsfeed-web.pages.dev")]
    [InlineData("https://abc123.newsfeed-web.pages.dev")]
    [InlineData("https://feat-foo.newsfeed-admin.pages.dev")]
    public void Allows_Configured_And_Pages_Previews(string origin) =>
        Assert.True(CorsOrigin.IsAllowed(origin, Configured));

    [Theory]
    [InlineData("http://newsfeed-web.pages.dev")]
    [InlineData("https://evil.pages.dev")]
    [InlineData("https://newsfeed-web.pages.dev.evil.com")]
    [InlineData("https://not-newsfeed-web.pages.dev")]
    [InlineData("https://main.newsfeed-web.pages.dev/extra")]
    [InlineData("")]
    [InlineData(null)]
    public void Rejects_Unknown_Or_Insecure_Origins(string? origin) =>
        Assert.False(CorsOrigin.IsAllowed(origin, Configured));
}
