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
    public void ExtractArticleLinks_PrefersBhaskarNewsOverNavAndVideoDupes()
    {
        const string html = """
            <html><body>
              <a href="/videos">Videos</a>
              <a href="/search">Search</a>
              <a href="/local/uttar-pradesh/jhansi/news/jhansi-rain-138712904.html">Rain</a>
              <a href="/local/uttar-pradesh/jhansi/video/jhansi-rain-138712904.html?type=video">Rain video</a>
              <a href="/local/uttar-pradesh/jhansi/news/jhansi-teacher-138716713.html">Teacher</a>
              <a href="/national/">National</a>
            </body></html>
            """;
        var baseUri = new Uri("https://www.bhaskar.com/local/uttar-pradesh/jhansi/");

        var links = HtmlArticleExtractor.ExtractArticleLinks(html, baseUri, maxLinks: 20);

        Assert.Equal(2, links.Count);
        Assert.Equal(
            "https://www.bhaskar.com/local/uttar-pradesh/jhansi/news/jhansi-rain-138712904.html",
            links[0].AbsoluteUri);
        Assert.Equal(
            "https://www.bhaskar.com/local/uttar-pradesh/jhansi/news/jhansi-teacher-138716713.html",
            links[1].AbsoluteUri);
        Assert.DoesNotContain(links, u => u.AbsolutePath.Contains("/video/", StringComparison.Ordinal));
        Assert.DoesNotContain(links, u => u.AbsolutePath is "/videos" or "/search");
    }

    [Fact]
    public void ExtractArticle_ReadsHeadlineAndSnippetFromH1AndP()
    {
        var html = File.ReadAllText(FixturePath("scrape-article.html"));

        var (headline, snippet, body, publishedAt) = HtmlArticleExtractor.ExtractArticle(html);

        Assert.Equal("Jhansi water supply restored", headline);
        Assert.Contains("piped water", snippet, StringComparison.Ordinal);
        Assert.Contains("piped water", body, StringComparison.Ordinal);
        Assert.Contains("restored pressure", body, StringComparison.Ordinal);
        Assert.Equal(new DateTimeOffset(2026, 8, 24, 10, 0, 0, TimeSpan.FromHours(5.5)), publishedAt);
    }

    [Fact]
    public void ExtractBody_JoinsArticleParagraphs()
    {
        var html = File.ReadAllText(FixturePath("scrape-article.html"));
        var body = HtmlArticleExtractor.ExtractBody(html);
        Assert.Contains("piped water", body, StringComparison.Ordinal);
        Assert.Contains("\n\n", body, StringComparison.Ordinal);
    }

    private static string FixturePath(string fileName) =>
        Path.Combine(AppContext.BaseDirectory, "Fixtures", fileName);
}
