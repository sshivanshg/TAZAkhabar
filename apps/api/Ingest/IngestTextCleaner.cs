using System.Text;

namespace NewsFeed.Api.Ingest;

/// <summary>
/// Normalizes headlines and summaries before an article is saved: strips trailing
/// " - Source" / " | Source" suffixes and drops summaries that only repeat the headline.
/// </summary>
public static class IngestTextCleaner
{
    private static readonly string[] Separators = [" - ", " | ", " – ", " — "];

    public static string CleanHeadline(string title, params string?[] sourceNames)
    {
        var original = (title ?? "").Trim();
        var names = sourceNames
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Select(n => n!.Trim())
            .ToList();
        if (names.Count == 0 || original.Length == 0)
        {
            return original;
        }

        var current = original;
        var changed = true;
        while (changed)
        {
            changed = false;
            foreach (var sep in Separators)
            {
                var idx = current.LastIndexOf(sep, StringComparison.Ordinal);
                if (idx <= 0)
                {
                    continue;
                }

                var tail = current[(idx + sep.Length)..].Trim();
                if (names.Any(n => string.Equals(n, tail, StringComparison.OrdinalIgnoreCase)))
                {
                    var head = current[..idx].TrimEnd();
                    if (head.Length == 0)
                    {
                        continue;
                    }

                    current = head;
                    changed = true;
                    break;
                }
            }
        }

        return current.Length > 0 ? current : original;
    }

    /// <summary>Returns "" when the summary equals or starts with the headline (normalized).</summary>
    public static string CleanSummary(string? summary, string headline)
    {
        var s = (summary ?? "").Trim();
        var normSummary = Normalize(s);
        var normHeadline = Normalize(headline);
        if (normSummary.Length == 0 || normHeadline.Length == 0)
        {
            return s;
        }

        var repeats = normSummary == normHeadline
            || normSummary.StartsWith(normHeadline + " ", StringComparison.Ordinal);
        return repeats ? "" : s;
    }

    private static string Normalize(string? text)
    {
        var sb = new StringBuilder();
        var lastSpace = true;
        foreach (var ch in (text ?? "").ToLowerInvariant())
        {
            if (char.IsLetterOrDigit(ch))
            {
                sb.Append(ch);
                lastSpace = false;
            }
            else if (!lastSpace)
            {
                sb.Append(' ');
                lastSpace = true;
            }
        }

        return sb.ToString().Trim();
    }
}
