using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class PdfTextExtractorTests
{
    [Fact]
    public void Extract_ReadsEmbeddedTextAndPageCount()
    {
        using var stream = File.OpenRead(FixturePath("hello.pdf"));

        var result = PdfTextExtractor.Extract(stream);

        Assert.Equal(1, result.PageCount);
        Assert.Contains("Jhansi municipal budget", result.Text, StringComparison.Ordinal);
        Assert.True(result.Text.Length >= 80);
    }

    private static string FixturePath(string fileName) =>
        Path.Combine(AppContext.BaseDirectory, "Fixtures", fileName);
}
