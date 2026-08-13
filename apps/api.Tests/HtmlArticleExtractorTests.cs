using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class HtmlArticleExtractorTests
{
    private static readonly Uri ListBaseUri = new("https://www.amarujala.com/uttar-pradesh/jhansi");

    [Fact]
    public void ExtractArticleLinks_ResolvesRelativeCityStoryAndCapsMax()
    {
        var html = File.ReadAllText(FixturePath("scrape-list.html"));

        var links = HtmlArticleExtractor.ExtractArticleLinks(html, ListBaseUri, maxLinks: 20);

        Assert.Contains(links, u => u.AbsoluteUri == "https://www.amarujala.com/city/story-1");
        Assert.Contains(links, u => u.AbsoluteUri == "https://www.amarujala.com/city/story-2");
        Assert.Contains(links, u => u.AbsoluteUri == "https://www.amarujala.com/city/story-3");
        Assert.DoesNotContain(links, u => u.Scheme == "javascript" || u.Scheme == "file");
        Assert.Equal(3, links.Count);

        var capped = HtmlArticleExtractor.ExtractArticleLinks(html, ListBaseUri, maxLinks: 1);
        Assert.Single(capped);
        Assert.Equal("https://www.amarujala.com/city/story-1", capped[0].AbsoluteUri);
    }

    [Fact]
    public void ExtractArticle_ReadsHeadlineAndSnippetFromH1AndP()
    {
        var html = File.ReadAllText(FixturePath("scrape-article.html"));

        var (headline, snippet, publishedAt) = HtmlArticleExtractor.ExtractArticle(html);

        Assert.Equal("Jhansi water supply restored", headline);
        Assert.Contains("piped water", snippet, StringComparison.Ordinal);
        Assert.Equal(new DateTimeOffset(2026, 8, 13, 10, 0, 0, TimeSpan.FromHours(5.5)), publishedAt);
    }

    private static string FixturePath(string fileName) =>
        Path.Combine(AppContext.BaseDirectory, "Fixtures", fileName);
}
