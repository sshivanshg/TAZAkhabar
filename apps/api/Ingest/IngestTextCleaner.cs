using System.Text;

namespace NewsFeed.Api.Ingest;

/// <summary>
/// Normalizes headlines and summaries before an article is saved: strips trailing
/// " - Source" / " | Source" suffixes and removes summary text that only repeats the headline.
/// </summary>
public static class IngestTextCleaner
{
    // Hyphen, figure dash, en dash, em dash, minus sign, pipe.
    private static readonly char[] SeparatorChars = ['-', '‒', '–', '—', '−', '|'];

    public static string CleanHeadline(string? title, params string?[] sourceNames)
    {
        var original = NormalizeSpaces(title);
        var names = CleanNames(sourceNames);
        if (names.Count == 0 || original.Length == 0)
        {
            return original;
        }

        var current = original;
        while (TryStripSuffix(current, names, out var head))
        {
            current = head;
        }

        return current.Length > 0 ? current : original;
    }

    /// <summary>
    /// Returns "" when the summary is just the headline (optionally followed by a source suffix);
    /// when it starts with the headline, strips that prefix and keeps the rest.
    /// </summary>
    public static string CleanSummary(string? summary, string headline, params string?[] sourceNames)
    {
        var s = NormalizeSpaces(summary);
        var normHeadline = Normalize(headline);
        if (s.Length == 0 || normHeadline.Length == 0)
        {
            return s;
        }

        var cut = PrefixEnd(s, normHeadline);
        if (cut < 0)
        {
            return s;
        }

        var rest = s[cut..].TrimStart(' ', '.', ',', ':', ';', '!', '?', '-', '‒', '–', '—', '−', '|').Trim();
        if (rest.Length == 0)
        {
            return "";
        }

        var names = CleanNames(sourceNames);
        return names.Any(n => string.Equals(n, rest.TrimEnd('.', ' '), StringComparison.OrdinalIgnoreCase)) ? "" : rest;
    }

    private static bool TryStripSuffix(string text, List<string> names, out string head)
    {
        head = text;
        foreach (var name in names)
        {
            if (!text.EndsWith(name, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var before = text[..^name.Length];
            var trimmed = before.TrimEnd();
            if (trimmed.Length == before.Length || trimmed.Length == 0
                || Array.IndexOf(SeparatorChars, trimmed[^1]) < 0)
            {
                continue;
            }

            var candidate = trimmed[..^1];
            if (candidate.Length == 0 || candidate[^1] != ' ')
            {
                continue;
            }

            candidate = candidate.TrimEnd();
            if (candidate.Length == 0)
            {
                continue;
            }

            head = candidate;
            return true;
        }

        return false;
    }

    /// <summary>Index in <paramref name="text"/> just after the headline prefix, or -1.</summary>
    private static int PrefixEnd(string text, string normHeadline)
    {
        var sb = new StringBuilder();
        var lastSpace = true;
        for (var i = 0; i < text.Length; i++)
        {
            var ch = char.ToLowerInvariant(text[i]);
            if (char.IsLetterOrDigit(ch))
            {
                sb.Append(ch);
                lastSpace = false;
                if (sb.Length == normHeadline.Length)
                {
                    var atBoundary = i + 1 >= text.Length || !char.IsLetterOrDigit(text[i + 1]);
                    return atBoundary && sb.ToString() == normHeadline ? i + 1 : -1;
                }
            }
            else if (!lastSpace)
            {
                sb.Append(' ');
                lastSpace = true;
            }

            if (sb.Length > normHeadline.Length || !normHeadline.StartsWith(sb.ToString(), StringComparison.Ordinal))
            {
                return -1;
            }
        }

        return -1;
    }

    private static List<string> CleanNames(string?[] names) =>
        names.Where(n => !string.IsNullOrWhiteSpace(n)).Select(n => NormalizeSpaces(n)).Distinct().ToList();

    private static string NormalizeSpaces(string? text)
    {
        var sb = new StringBuilder();
        var lastSpace = false;
        foreach (var ch in text ?? "")
        {
            if (char.IsWhiteSpace(ch) || char.IsSeparator(ch))
            {
                if (!lastSpace)
                {
                    sb.Append(' ');
                }

                lastSpace = true;
            }
            else
            {
                sb.Append(ch);
                lastSpace = false;
            }
        }

        return sb.ToString().Trim();
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
