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

    [Fact]
    public void MatchesCity_Kanpur_Hindi()
    {
        Assert.True(PlaceNameMatcher.MatchesCity("kanpur", "कानपुर में बस अड्डा", ""));
    }

    [Fact]
    public void MatchesCity_Lucknow_RejectsKanpurOnly()
    {
        Assert.False(PlaceNameMatcher.MatchesCity("lucknow", "Kanpur metro update", ""));
    }

    [Fact]
    public void MatchesJhansiEdition_StillWorks()
    {
        Assert.True(PlaceNameMatcher.MatchesJhansiEdition("Orchha fort", ""));
    }

    [Fact]
    public void MatchesCity_Delhi_IncludesGurugram()
    {
        Assert.True(PlaceNameMatcher.MatchesCity("delhi", "Metro extension opens in Gurugram", ""));
    }

    [Fact]
    public void MatchesCity_Delhi_IncludesNoidaHindi()
    {
        Assert.True(PlaceNameMatcher.MatchesCity("delhi", "नोएडा में ट्रैफिक जाम", ""));
    }

    [Fact]
    public void DetectCitySlug_ReturnsDelhiForNcr()
    {
        Assert.Equal("delhi", PlaceNameMatcher.DetectCitySlug("NCR air quality advisory", null));
    }
}
