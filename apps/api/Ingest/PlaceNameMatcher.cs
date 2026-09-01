namespace NewsFeed.Api.Ingest;

public static class PlaceNameMatcher
{
    private static readonly Dictionary<string, string[]> Places = new(StringComparer.OrdinalIgnoreCase)
    {
        ["jhansi"] = ["Jhansi", "झांसी", "Orchha", "ओरछा", "Lalitpur", "ललितपुर", "Datia", "दतिया", "Babina", "बबीना"],
        ["kanpur"] = ["Kanpur", "कानपुर", "Kanpur Nagar", "Kanpur Dehat"],
        ["lucknow"] = ["Lucknow", "लखनऊ", "Gomti Nagar", "गोमती नगर"],
        // Delhi picker covers Gurugram / Noida / broader NCR under one feed.
        ["delhi"] =
        [
            "Delhi", "New Delhi", "दिल्ली", "नई दिल्ली",
            "Gurugram", "Gurgaon", "गुरुग्राम", "गुड़गांव",
            "Noida", "नोएडा", "Greater Noida", "ग्रेटर नोएडा",
            "Faridabad", "फरीदाबाद",
            "Ghaziabad", "गाजियाबाद",
            "NCR", "एनसीआर",
        ],
    };

    public static bool MatchesCity(string citySlug, string? title, string? snippet)
    {
        var cityName = citySlug.Replace('-', ' ');
        return MatchesCity(citySlug, cityName, title, snippet);
    }

    public static bool MatchesCity(string citySlug, string cityName, string? title, string? snippet)
    {
        var names = ResolvePlaceNames(citySlug, cityName);
        var text = $"{title} {snippet}";
        return names.Any(n => text.Contains(n, StringComparison.OrdinalIgnoreCase));
    }

    private static IReadOnlyList<string> ResolvePlaceNames(string citySlug, string cityName)
    {
        if (Places.TryGetValue(citySlug, out var aliases))
            return aliases;

        return [cityName, cityName.Replace('-', ' ')];
    }

    public static bool MatchesJhansiEdition(string? title, string? snippet) =>
        MatchesCity("jhansi", "Jhansi", title, snippet);

    public static string? DetectCitySlug(string? title, string? snippet)
    {
        foreach (var slug in new[] { "jhansi", "kanpur", "lucknow", "delhi" })
        {
            if (MatchesCity(slug, title, snippet)) return slug;
        }
        return null;
    }
}
