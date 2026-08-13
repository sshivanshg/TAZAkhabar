using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class PlaceNameMatcherTests
{
    [Fact]
    public void Matches_Orchha_InTitle()
    {
        Assert.True(PlaceNameMatcher.MatchesJhansiEdition("PWD pause near Orchha junction", "state road works"));
    }

    [Fact]
    public void Rejects_LucknowOnly()
    {
        Assert.False(PlaceNameMatcher.MatchesJhansiEdition("Gomti walkway lighting in Lucknow", "capital news"));
    }

    [Fact]
    public void Matches_HindiJhansi()
    {
        Assert.True(PlaceNameMatcher.MatchesJhansiEdition("झांसी में जल केंद्र", ""));
    }
}
