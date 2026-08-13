namespace NewsFeed.Api.Ingest;

public static class PlaceNameMatcher
{
    private static readonly Dictionary<string, string[]> Places = new(StringComparer.OrdinalIgnoreCase)
    {
        ["jhansi"] = ["Jhansi", "झांसी", "Orchha", "ओरछा", "Lalitpur", "ललितपुर", "Datia", "दतिया", "Babina", "बबीना"],
        ["kanpur"] = ["Kanpur", "कानपुर", "Kanpur Nagar", "Kanpur Dehat"],
        ["lucknow"] = ["Lucknow", "लखनऊ", "Gomti Nagar", "गोमती नगर"],
    };

    public static bool MatchesCity(string citySlug, string? title, string? snippet)
    {
        if (!Places.TryGetValue(citySlug, out var names)) return false;
        var text = $"{title} {snippet}";
        return names.Any(n => text.Contains(n, StringComparison.OrdinalIgnoreCase));
    }

    public static bool MatchesJhansiEdition(string? title, string? snippet) =>
        MatchesCity("jhansi", title, snippet);

    public static string? DetectCitySlug(string? title, string? snippet)
    {
        foreach (var slug in new[] { "jhansi", "kanpur", "lucknow" })
        {
            if (MatchesCity(slug, title, snippet)) return slug;
        }
        return null;
    }
}
