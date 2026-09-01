using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class ArticleSourceUrlTests
{
    [Fact]
    public void Normalize_DecodesEntities_AndTrims()
    {
        var url = ArticleSourceUrl.Normalize("  https://news.google.com/rss/articles/ABC&amp;def=1  ");
        Assert.Equal("https://news.google.com/rss/articles/ABC&def=1", url);
    }

    [Fact]
    public void Normalize_PreservesLongGoogleNewsUrls()
    {
        var longToken = new string('A', 700);
        var raw = $"https://news.google.com/rss/articles/{longToken}?oc=5";
        var normalized = ArticleSourceUrl.Normalize(raw);
        Assert.Equal(raw, normalized);
        Assert.True(normalized.Length > 500);
    }

    [Fact]
    public void LooksLegacyTruncated_DetectsCappedGoogleNewsLinks()
    {
        var truncated = ("https://news.google.com/rss/articles/" + new string('x', 500))[..500];
        Assert.Equal(500, truncated.Length);
        Assert.True(ArticleSourceUrl.LooksLegacyTruncated(truncated));
        Assert.False(ArticleSourceUrl.LooksLegacyTruncated("https://example.com/story"));
    }
}
