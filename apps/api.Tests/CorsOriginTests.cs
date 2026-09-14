namespace NewsFeed.Api.Tests;

public sealed class CorsOriginTests
{
    private static readonly string[] Configured =
    [
        "https://khabro.in",
        "https://admin.khabro.in",
    ];

    [Theory]
    [InlineData("https://khabro.in")]
    [InlineData("https://admin.khabro.in")]
    [InlineData("https://www.khabro.in")]
    [InlineData("https://newsfeed-web.pages.dev")]
    [InlineData("https://website-launch.newsfeed-web.pages.dev")]
    [InlineData("https://newsfeed-admin.pages.dev")]
    [InlineData("https://main.newsfeed-admin.pages.dev")]
    public void Allows_Configured_And_Pages_Previews(string origin) =>
        Assert.True(CorsOrigin.IsAllowed(origin, Configured));

    [Theory]
    [InlineData("http://khabro.in")]
    [InlineData("https://evil.pages.dev")]
    [InlineData("https://khabro.in.evil.com")]
    [InlineData("https://main.khabro.in")]
    [InlineData("https://foo.admin.khabro.in")]
    [InlineData("https://not-newsfeed-web.pages.dev")]
    [InlineData("https://newsfeed-web.pages.dev.evil.com")]
    [InlineData("https://api.khabro.in")]
    [InlineData("https://khabro.in/extra")]
    [InlineData("")]
    [InlineData(null)]
    public void Rejects_Unknown_Or_Insecure_Origins(string? origin) =>
        Assert.False(CorsOrigin.IsAllowed(origin, Configured));
}
