using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class OgImageExtractorTests
{
    [Fact]
    public void Prefers_og_image_over_twitter()
    {
        var html = """
            <html><head>
            <meta property="og:image" content="https://cdn.example/a.jpg" />
            <meta name="twitter:image" content="https://cdn.example/b.jpg" />
            </head></html>
            """;
        Assert.Equal(
            "https://cdn.example/a.jpg",
            OgImageExtractor.TryExtract(html, new Uri("https://news.example/story")));
    }

    [Fact]
    public void Falls_back_to_twitter_image()
    {
        var html = """
            <html><head>
            <meta name="twitter:image" content="https://cdn.example/b.jpg" />
            </head></html>
            """;
        Assert.Equal(
            "https://cdn.example/b.jpg",
            OgImageExtractor.TryExtract(html, new Uri("https://news.example/story")));
    }

    [Fact]
    public void Resolves_relative_og_image()
    {
        var html = """<meta property="og:image" content="/img/x.jpg" />""";
        Assert.Equal(
            "https://news.example/img/x.jpg",
            OgImageExtractor.TryExtract(html, new Uri("https://news.example/story/1")));
    }

    [Fact]
    public void Returns_null_when_missing()
    {
        Assert.Null(OgImageExtractor.TryExtract("<html></html>", new Uri("https://news.example/")));
    }

    [Fact]
    public void Handles_content_before_property()
    {
        var html = """<meta content="https://cdn.example/c.jpg" property="og:image" />""";
        Assert.Equal(
            "https://cdn.example/c.jpg",
            OgImageExtractor.TryExtract(html, new Uri("https://news.example/story")));
    }
}
