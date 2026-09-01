using NewsFeed.Api.Data.Entities;

namespace NewsFeed.Api.Data;

/// <summary>
/// National publishers surfaced in Google News "Local" for every seeded city.
/// Uses site-scoped Google News RSS (7-day window).
/// IDs 3000+ reserved (20 slots per city × 75 cities; publishers fill first N slots).
/// </summary>
public static class NationalPublisherSourceCatalog
{
    public const int BaseId = 3000;

    /// <summary>Fixed stride per city so new publishers can be appended without renumbering.</summary>
    public const int MaxSlotsPerCity = 20;

    public sealed record PublisherDefinition(string Name, string Host, string Language = "en");

    /// <summary>English and Hindi publishers commonly shown in Google News India local/discovery.</summary>
    public static readonly PublisherDefinition[] Publishers =
    [
        // Core English national
        new("The Print", "theprint.in"),
        new("The Hindu", "thehindu.com"),
        new("Times of India", "timesofindia.indiatimes.com"),
        new("NDTV", "ndtv.com"),
        new("The Indian Express", "indianexpress.com"),
        new("Hindustan Times", "hindustantimes.com"),
        new("Telegraph India", "telegraphindia.com"),
        new("India Today", "indiatoday.in"),
        // Business and international
        new("Economic Times", "economictimes.indiatimes.com"),
        new("Livemint", "livemint.com"),
        new("Business Standard", "business-standard.com"),
        new("BBC", "bbc.com"),
        new("Al Jazeera", "aljazeera.com"),
        // Digital and regional English
        new("Scroll.in", "scroll.in"),
        new("Firstpost", "firstpost.com"),
        new("The News Minute", "thenewsminute.com"),
        new("Deccan Herald", "deccanherald.com"),
        new("The Wire", "thewire.in"),
        // Hindi national
        new("Jagran", "jagran.com", "hi"),
    ];

    /// <summary>Google News search terms for cities with common alternate spellings.</summary>
    private static readonly Dictionary<string, string> CitySearchQueries = new(StringComparer.OrdinalIgnoreCase)
    {
        ["bengaluru"] = "Bengaluru OR Bangalore",
        ["prayagraj"] = "Prayagraj OR Allahabad",
        ["gurugram"] = "Gurugram OR Gurgaon",
        ["kozhikode"] = "Kozhikode OR Calicut",
        ["mangaluru"] = "Mangaluru OR Mangalore",
        ["mysuru"] = "Mysuru OR Mysore",
        ["tiruchirappalli"] = "Tiruchirappalli OR Trichy",
        ["thiruvananthapuram"] = "Thiruvananthapuram OR Trivandrum",
        ["hubballi"] = "Hubballi OR Hubli",
        ["visakhapatnam"] = "Visakhapatnam OR Vizag",
        ["delhi"] = "Delhi OR New Delhi OR NCR",
        ["noida"] = "Noida OR Greater Noida",
        ["ghaziabad"] = "Ghaziabad",
        ["faridabad"] = "Faridabad",
        ["jhansi"] = "Jhansi OR Lalitpur OR Orchha",
        ["kanpur"] = "Kanpur",
        ["lucknow"] = "Lucknow",
    };

    public static string CitySearchQuery(string slug, string cityName) =>
        CitySearchQueries.TryGetValue(slug, out var query) ? query : cityName;

    public static int SourceId(int cityId, int publisherIndex) =>
        BaseId + (cityId - 1) * MaxSlotsPerCity + publisherIndex;

    public static LocalPublisherSourceCatalog.PublisherSourceSeed[] BuildSources() =>
        SeedData.Cities
            .SelectMany(city => Publishers.Select((publisher, index) =>
                new LocalPublisherSourceCatalog.PublisherSourceSeed(
                    SourceId(city.Id, index),
                    city.Id,
                    publisher.Name,
                    LocalPublisherSourceCatalog.GoogleNewsSiteRss(
                        publisher.Host,
                        CitySearchQuery(city.Slug, city.Name)),
                    SourceType.Rss,
                    SourceKind.CityEdition,
                    publisher.Language)))
            .ToArray();

    public static readonly LocalPublisherSourceCatalog.PublisherSourceSeed[] Sources = BuildSources();
}
