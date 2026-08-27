namespace NewsFeed.Api.Tests;

public sealed class CorsOriginTests
{
    private static readonly string[] Configured =
    [
        "https://tazakhabar-web.pages.dev",
        "https://tazakhabar-admin.pages.dev",
    ];

    [Theory]
    [InlineData("https://tazakhabar-web.pages.dev")]
    [InlineData("https://tazakhabar-admin.pages.dev")]
    [InlineData("https://main.tazakhabar-web.pages.dev")]
    [InlineData("https://abc123.tazakhabar-web.pages.dev")]
    [InlineData("https://feat-foo.tazakhabar-admin.pages.dev")]
    [InlineData("https://newsfeed-web.pages.dev")]
    [InlineData("https://website-launch.newsfeed-web.pages.dev")]
    [InlineData("https://newsfeed-admin.pages.dev")]
    [InlineData("https://main.newsfeed-admin.pages.dev")]
    public void Allows_Configured_And_Pages_Previews(string origin) =>
        Assert.True(CorsOrigin.IsAllowed(origin, Configured));

    [Theory]
    [InlineData("http://tazakhabar-web.pages.dev")]
    [InlineData("https://evil.pages.dev")]
    [InlineData("https://tazakhabar-web.pages.dev.evil.com")]
    [InlineData("https://not-tazakhabar-web.pages.dev")]
    [InlineData("https://not-newsfeed-web.pages.dev")]
    [InlineData("https://newsfeed-web.pages.dev.evil.com")]
    [InlineData("https://main.tazakhabar-web.pages.dev/extra")]
    [InlineData("")]
    [InlineData(null)]
    public void Rejects_Unknown_Or_Insecure_Origins(string? origin) =>
        Assert.False(CorsOrigin.IsAllowed(origin, Configured));
}
