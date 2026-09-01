using NewsFeed.Api.Data.Entities;

namespace NewsFeed.Api.Data;

/// <summary>
/// Curated publisher feeds for city-level local news beyond Google News discovery.
/// IDs 2000+ are reserved for this catalog (see migration DeepenLocalPublisherSources).
/// </summary>
public static class LocalPublisherSourceCatalog
{
    public sealed record PublisherSourceSeed(
        int Id,
        int CityId,
        string Name,
        string FeedUrl,
        SourceType Type,
        SourceKind Kind,
        string Language);

    /// <summary>Fresh Google News RSS query with a 7-day window for scheduled rotation.</summary>
    public static string GoogleNewsRss(string cityName, string language = "hi") =>
        language.Equals("en", StringComparison.OrdinalIgnoreCase)
            ? $"https://news.google.com/rss/search?q={Uri.EscapeDataString(cityName + " when:7d")}&hl=en-IN&gl=IN&ceid=IN:en"
            : $"https://news.google.com/rss/search?q={Uri.EscapeDataString(cityName + " when:7d")}&hl=hi&gl=IN&ceid=IN:hi";

    public static readonly PublisherSourceSeed[] DeepenSources =
    [
        // Amar Ujala city RSS — Hindi heartland + NCR (skip cities that already have AU RSS in pilot seeds)
        AuRss(2001, 1, "agra"),
        AuRss(2002, 3, "kanpur"),
        AuRss(2003, 4, "lucknow"),
        AuRss(2004, 5, "delhi-ncr"),
        AuRss(2005, 10, "kolkata"),
        AuRss(2006, 14, "jaipur"),
        AuRss(2007, 15, "chandigarh"),
        AuRss(2008, 16, "indore"),
        AuRss(2009, 17, "bhopal"),
        AuRss(2010, 18, "patna"),
        AuRss(2011, 19, "ranchi"),
        AuRss(2012, 21, "guwahati"),
        AuRss(2013, 35, "varanasi"),
        AuRss(2014, 36, "allahabad"),
        AuRss(2015, 37, "meerut"),
        AuRss(2016, 38, "bareilly"),
        AuRss(2017, 39, "gorakhpur"),
        AuRss(2018, 40, "dehradun"),
        AuRss(2019, 41, "haridwar"),
        AuRss(2020, 42, "shimla"),
        AuRss(2021, 43, "jammu"),
        AuRss(2022, 44, "srinagar"),
        AuRss(2023, 45, "amritsar"),
        AuRss(2024, 46, "ludhiana"),
        AuRss(2025, 48, "raipur"),
        AuRss(2026, 64, "agartala"),
        AuRss(2027, 65, "shillong"),
        AuRss(2028, 67, "aizwal"),
        AuRss(2029, 68, "kohima"),
        AuRss(2030, 69, "gangtok"),
        AuRss(2031, 70, "itanagar"),
        AuRss(2032, 72, "noida"),
        AuRss(2033, 73, "ghaziabad"),
        AuRss(2034, 74, "faridabad"),
        AuRss(2035, 34, "udaipur"),
        AuRss(2036, 33, "jodhpur"),

        // Dainik Bhaskar local edition scrape — strong UP/MP/Rajasthan/Chhattisgarh coverage
        BhaskarScrape(2101, 1, "uttar-pradesh", "agra"),
        BhaskarScrape(2102, 3, "uttar-pradesh", "kanpur"),
        BhaskarScrape(2103, 4, "uttar-pradesh", "lucknow"),
        BhaskarScrape(2104, 35, "uttar-pradesh", "varanasi"),
        BhaskarScrape(2105, 36, "uttar-pradesh", "allahabad"),
        BhaskarScrape(2106, 37, "uttar-pradesh", "meerut"),
        BhaskarScrape(2107, 38, "uttar-pradesh", "bareilly"),
        BhaskarScrape(2108, 39, "uttar-pradesh", "gorakhpur"),
        BhaskarScrape(2109, 16, "madhya-pradesh", "indore"),
        BhaskarScrape(2110, 17, "madhya-pradesh", "bhopal"),
        BhaskarScrape(2111, 14, "rajasthan", "jaipur"),
        BhaskarScrape(2112, 33, "rajasthan", "jodhpur"),
        BhaskarScrape(2113, 34, "rajasthan", "udaipur"),
        BhaskarScrape(2114, 18, "bihar", "patna"),
        BhaskarScrape(2115, 19, "jharkhand", "ranchi"),
        BhaskarScrape(2116, 48, "chhattisgarh", "raipur"),
        BhaskarScrape(2117, 40, "uttarakhand", "dehradun"),
        BhaskarScrape(2118, 41, "uttarakhand", "haridwar"),

        // Times of India city pages — metros and tier-2 English local coverage
        ToiScrape(2201, 6, "mumbai"),
        ToiScrape(2202, 7, "bangalore"),
        ToiScrape(2203, 8, "hyderabad"),
        ToiScrape(2204, 9, "chennai"),
        ToiScrape(2205, 10, "kolkata"),
        ToiScrape(2206, 11, "pune"),
        ToiScrape(2207, 12, "ahmedabad"),
        ToiScrape(2208, 13, "surat"),
        ToiScrape(2209, 14, "jaipur"),
        ToiScrape(2210, 15, "chandigarh"),
        ToiScrape(2211, 16, "indore"),
        ToiScrape(2212, 17, "bhopal"),
        ToiScrape(2213, 18, "patna"),
        ToiScrape(2214, 19, "ranchi"),
        ToiScrape(2215, 20, "bhubaneswar"),
        ToiScrape(2216, 21, "guwahati"),
        ToiScrape(2217, 22, "kochi"),
        ToiScrape(2218, 23, "thiruvananthapuram"),
        ToiScrape(2219, 25, "coimbatore"),
        ToiScrape(2220, 26, "madurai"),
        ToiScrape(2221, 27, "visakhapatnam"),
        ToiScrape(2222, 28, "vijayawada"),
        ToiScrape(2223, 29, "nagpur"),
        ToiScrape(2224, 30, "nashik"),
        ToiScrape(2225, 31, "vadodara"),
        ToiScrape(2226, 32, "rajkot"),
        ToiScrape(2227, 45, "amritsar"),
        ToiScrape(2228, 46, "ludhiana"),
        ToiScrape(2229, 55, "mangalore"),
        ToiScrape(2230, 56, "mysore"),
        ToiScrape(2231, 61, "trichy"),

        // English Google News discovery for major metros (Hindi already seeded at 1000+cityId)
        GoogleEnRss(2301, 6, "Mumbai"),
        GoogleEnRss(2302, 7, "Bengaluru"),
        GoogleEnRss(2303, 8, "Hyderabad"),
        GoogleEnRss(2304, 9, "Chennai"),
        GoogleEnRss(2305, 10, "Kolkata"),
        GoogleEnRss(2306, 11, "Pune"),
        GoogleEnRss(2307, 12, "Ahmedabad"),
        GoogleEnRss(2308, 20, "Bhubaneswar"),
        GoogleEnRss(2309, 27, "Visakhapatnam"),
        GoogleEnRss(2310, 29, "Nagpur"),
    ];

    private static PublisherSourceSeed AuRss(int id, int cityId, string slug) =>
        new(
            id,
            cityId,
            "Amar Ujala",
            $"https://www.amarujala.com/rss/{slug}.xml",
            SourceType.Rss,
            SourceKind.CityEdition,
            "hi");

    private static PublisherSourceSeed BhaskarScrape(int id, int cityId, string stateSlug, string citySlug) =>
        new(
            id,
            cityId,
            "Dainik Bhaskar",
            $"https://www.bhaskar.com/local/{stateSlug}/{citySlug}/",
            SourceType.Scrape,
            SourceKind.CityEdition,
            "hi");

    private static PublisherSourceSeed ToiScrape(int id, int cityId, string toiSlug) =>
        new(
            id,
            cityId,
            "Times of India",
            $"https://timesofindia.indiatimes.com/city/{toiSlug}",
            SourceType.Scrape,
            SourceKind.CityEdition,
            "en");

    private static PublisherSourceSeed GoogleEnRss(int id, int cityId, string cityName) =>
        new(
            id,
            cityId,
            "Google News",
            GoogleNewsRss(cityName, "en"),
            SourceType.Rss,
            SourceKind.CityEdition,
            "en");
}
