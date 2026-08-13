using System.Text.RegularExpressions;

namespace NewsFeed.Api.Ingest;

public static partial class OgImageExtractor
{
    public static string? TryExtract(string html, Uri pageUrl)
    {
        ArgumentNullException.ThrowIfNull(pageUrl);
        if (string.IsNullOrWhiteSpace(html))
        {
            return null;
        }

        var raw = FindMetaContent(html, "og:image") ?? FindMetaContent(html, "twitter:image");
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        if (!Uri.TryCreate(pageUrl, raw.Trim(), out var absolute) || absolute is null)
        {
            return null;
        }

        if (absolute.Scheme != Uri.UriSchemeHttp && absolute.Scheme != Uri.UriSchemeHttps)
        {
            return null;
        }

        return HtmlText.Truncate(absolute.AbsoluteUri, 500);
    }

    private static string? FindMetaContent(string html, string key)
    {
        foreach (Match tag in MetaTagRegex().Matches(html))
        {
            var keyMatch = KeyAttrRegex().Match(tag.Value);
            var contentMatch = ContentAttrRegex().Match(tag.Value);
            if (!keyMatch.Success || !contentMatch.Success)
            {
                continue;
            }

            if (!keyMatch.Groups["key"].Value.Equals(key, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var content = contentMatch.Groups["content"].Value.Trim();
            if (string.IsNullOrWhiteSpace(content))
            {
                continue;
            }

            return System.Net.WebUtility.HtmlDecode(content);
        }

        return null;
    }

    [GeneratedRegex(
        """
        <meta\b(?=[^>]*\b(?:property|name)\s*=)(?=[^>]*\bcontent\s*=)[^>]*>
        """,
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant,
        matchTimeoutMilliseconds: 250)]
    private static partial Regex MetaTagRegex();

    [GeneratedRegex(
        """
        \b(?:property|name)\s*=\s*["'](?<key>[^"']+)["']
        """,
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant,
        matchTimeoutMilliseconds: 250)]
    private static partial Regex KeyAttrRegex();

    [GeneratedRegex(
        """
        \bcontent\s*=\s*["'](?<content>[^"']*)["']
        """,
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant,
        matchTimeoutMilliseconds: 250)]
    private static partial Regex ContentAttrRegex();
}
