using NewsFeed.Api.Data;

namespace NewsFeed.Api.Tests;

public sealed class NationalPublisherSourceCatalogTests
{
    [Fact]
    public void Sources_CoversAllCities_WithEveryPublisher()
    {
        Assert.Equal(SeedData.Cities.Length * NationalPublisherSourceCatalog.Publishers.Length, NationalPublisherSourceCatalog.Sources.Length);
        Assert.Equal(1875, NationalPublisherSourceCatalog.Sources.Length);
        Assert.Equal(25, NationalPublisherSourceCatalog.Publishers.Length);
    }

    [Fact]
    public void Sources_UseUniqueIdsStartingAt3000_WithStridePerCity()
    {
        var ids = NationalPublisherSourceCatalog.Sources.Select(s => s.Id).ToList();
        Assert.Equal(ids.Count, ids.Distinct().Count());
        Assert.Equal(3000, ids.Min());
        Assert.Equal(5244, ids.Max());
    }

    [Fact]
    public void JhansiSources_IncludeThePrintGoogleNewsFeed()
    {
        var jhansiPrint = NationalPublisherSourceCatalog.Sources.Single(s =>
            s.CityId == 2 && s.Name == "The Print");

        Assert.Contains("site%3Atheprint.in", jhansiPrint.FeedUrl, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Jhansi", jhansiPrint.FeedUrl, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void HindiPublishers_UseHindiLanguageTag()
    {
        var jhansiJagran = NationalPublisherSourceCatalog.Sources.Single(s =>
            s.CityId == 2 && s.Name == "Jagran");
        var lucknowNbt = NationalPublisherSourceCatalog.Sources.Single(s =>
            s.CityId == 4 && s.Name == "Navbharat Times");

        Assert.Equal("hi", jhansiJagran.Language);
        Assert.Equal("hi", lucknowNbt.Language);
    }

    [Fact]
    public void DainikBhaskarEnglish_UsesBhaskarDomain()
    {
        var kanpurBhaskar = NationalPublisherSourceCatalog.Sources.Single(s =>
            s.CityId == 3 && s.Name == "Dainik Bhaskar");

        Assert.Equal("en", kanpurBhaskar.Language);
        Assert.Contains("site%3Abhaskar.com", kanpurBhaskar.FeedUrl, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData("bengaluru", "Bengaluru", "Bengaluru OR Bangalore")]
    [InlineData("mumbai", "Mumbai", "Mumbai")]
    public void CitySearchQuery_UsesAliasesWhenConfigured(string slug, string name, string expected)
    {
        Assert.Equal(expected, NationalPublisherSourceCatalog.CitySearchQuery(slug, name));
    }
}
