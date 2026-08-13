using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class RssFeedParserTests
{
    private const string Feed = """
        <?xml version="1.0"?><rss version="2.0"><channel>
          <item>
            <title>  &lt;b&gt;झांसी बजट&lt;/b&gt; </title>
            <link>https://www.amarujala.com/jhansi/story-1</link>
            <description>&lt;p&gt;नगर निगम&lt;/p&gt;</description>
            <pubDate>Thu, 13 Aug 2026 04:17:33 +0530</pubDate>
            <source url="https://www.amarujala.com">Amar Ujala</source>
          </item>
          <item>
            <title></title>
            <link>https://example.com/empty-title</link>
          </item>
        </channel></rss>
        """;

    [Fact]
    public void Parse_StripsHtml_SkipsEmptyTitle()
    {
        var items = RssFeedParser.Parse(Feed);
        var item = Assert.Single(items);
        Assert.Equal("झांसी बजट", item.Title);
        Assert.Equal("नगर निगम", item.Snippet);
        Assert.Equal("https://www.amarujala.com/jhansi/story-1", item.SourceUrl);
        Assert.Equal("Amar Ujala", item.SourceName);
        Assert.NotNull(item.PublishedAt);
    }

    [Fact]
    public void Parse_MalformedXml_ReturnsEmpty()
    {
        Assert.Empty(RssFeedParser.Parse("<not-rss"));
    }
}
