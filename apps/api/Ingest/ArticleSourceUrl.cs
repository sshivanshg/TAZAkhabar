using System.Net;

namespace NewsFeed.Api.Ingest;

public static class ArticleSourceUrl
{
    public const int MaxLength = 2048;

    /// <summary>
    /// Normalize publisher URLs for storage and outbound links — decode entities, trim, cap length.
    /// </summary>
    public static string Normalize(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return "";
        }

        var normalized = WebUtility.HtmlDecode(raw.Trim());
        if (normalized.Length <= MaxLength)
        {
            return normalized;
        }

        return normalized[..MaxLength];
    }

    /// <summary>
    /// URLs stored at the legacy 500-char cap are often broken Google News redirect links.
    /// </summary>
    public static bool LooksLegacyTruncated(string? sourceUrl) =>
        !string.IsNullOrWhiteSpace(sourceUrl)
        && sourceUrl.Length >= 500
        && sourceUrl.Contains("news.google.com", StringComparison.OrdinalIgnoreCase);
}
