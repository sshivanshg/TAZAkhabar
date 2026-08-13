namespace NewsFeed.Api.Ingest;

public static class PlaceNameMatcher
{
    private static readonly string[] PlaceNames =
    [
        "Jhansi",
        "झांसी",
        "Orchha",
        "ओरछा",
        "Lalitpur",
        "ललितपुर",
        "Datia",
        "दतिया",
        "Babina",
        "बबीना",
    ];

    public static bool MatchesJhansiEdition(string? title, string? snippet)
    {
        var text = $"{title} {snippet}";

        foreach (var name in PlaceNames)
        {
            if (text.Contains(name, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}
