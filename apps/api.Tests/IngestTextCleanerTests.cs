using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class IngestTextCleanerTests
{
    [Theory]
    [InlineData("Some headline - India Today - India Today", "India Today", null, "Some headline")]
    [InlineData("Some headline | india today", "India Today", null, "Some headline")]
    [InlineData("Some headline - Hindustan Times | India Today", "India Today", "Hindustan Times", "Some headline")]
    [InlineData("Rain lashes Pune - Times of India", "Google News", "Times of India", "Rain lashes Pune")]
    [InlineData("Price - Quality debate rages", "India Today", null, "Price - Quality debate rages")]
    [InlineData("Plain headline", "India Today", null, "Plain headline")]
    public void CleanHeadline_StripsSourceSuffixes(string title, string feedName, string? publisher, string expected)
    {
        Assert.Equal(expected, IngestTextCleaner.CleanHeadline(title, feedName, publisher));
    }

    [Theory]
    [InlineData("India Today", "India Today")]
    [InlineData("India Today - India Today", "India Today")]
    public void CleanHeadline_NeverReturnsEmpty(string title, string feedName)
    {
        var cleaned = IngestTextCleaner.CleanHeadline(title, feedName, null);
        Assert.False(string.IsNullOrWhiteSpace(cleaned));
    }

    [Theory]
    [InlineData("Some headline", "Some headline", "")]
    [InlineData("Some headline", "some headline - India Today", "")]
    [InlineData("Some headline", "  Some   headline. More details follow here.", "")]
    [InlineData("Some headline", "A different summary of the story.", "A different summary of the story.")]
    public void CleanSummary_DropsSummaryThatRepeatsHeadline(string headline, string summary, string expected)
    {
        Assert.Equal(expected, IngestTextCleaner.CleanSummary(summary, headline));
    }
}
