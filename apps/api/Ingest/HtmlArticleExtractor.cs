using System.Text.RegularExpressions;
using AngleSharp.Html.Parser;

namespace NewsFeed.Api.Ingest;

public static partial class HtmlArticleExtractor
{
    private const int MaxHeadlineChars = 300;
    private const int MaxSnippetChars = 400;
    private const int MaxBodyChars = 50_000;

    public static IReadOnlyList<Uri> ExtractArticleLinks(string listHtml, Uri baseUri, int maxLinks)
    {
        if (string.IsNullOrWhiteSpace(listHtml) || maxLinks <= 0)
        {
            return [];
        }

        var document = new HtmlParser().ParseDocument(listHtml);
        var candidates = new List<Uri>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var anchor in document.QuerySelectorAll("a[href]"))
        {
            var href = anchor.GetAttribute("href")?.Trim();
            if (string.IsNullOrWhiteSpace(href) || href.StartsWith('#')
                || href.StartsWith("javascript:", StringComparison.OrdinalIgnoreCase)
                || href.StartsWith("mailto:", StringComparison.OrdinalIgnoreCase)
                || href.StartsWith("tel:", StringComparison.OrdinalIgnoreCase)
                || href.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!Uri.TryCreate(baseUri, href, out var resolved) || resolved is null)
            {
                continue;
            }

            if (!SafeHttp.TryValidatePublicAbsoluteUri(resolved.AbsoluteUri, out var safe, out _))
            {
                continue;
            }

            if (safe.AbsolutePath is "" or "/")
            {
                continue;
            }

            if (LooksLikeEpaperLink(safe))
            {
                continue;
            }

            // Drop tracking query noise for dedupe; keep absolute URI for fetch.
            var dedupeKey = safe.GetLeftPart(UriPartial.Path);
            if (!seen.Add(dedupeKey))
            {
                continue;
            }

            candidates.Add(safe);
        }

        var preferred = candidates.Where(LooksLikeArticleLink).ToList();
        var pool = preferred.Count > 0 ? preferred : candidates.Where(u => !LooksLikeNavLink(u)).ToList();
        if (pool.Count == 0)
        {
            pool = candidates;
        }

        // Prefer text/news URLs over video twins that share the same story id.
        pool = pool
            .Select((uri, index) => (uri, index))
            .OrderBy(x => x.uri.AbsolutePath.Contains("/video/", StringComparison.OrdinalIgnoreCase) ? 1 : 0)
            .ThenBy(x => x.index)
            .Select(x => x.uri)
            .ToList();

        var links = new List<Uri>();
        var storyIds = new HashSet<string>(StringComparer.Ordinal);
        foreach (var link in pool)
        {
            var storyId = TryStoryId(link);
            if (storyId is not null && !storyIds.Add(storyId))
            {
                continue;
            }

            links.Add(link);
            if (links.Count >= maxLinks)
            {
                break;
            }
        }

        return links;
    }

    public static (string Headline, string Snippet, string Body, DateTimeOffset? PublishedAt) ExtractArticle(string articleHtml)
    {
        if (string.IsNullOrWhiteSpace(articleHtml))
        {
            return ("", "", "", null);
        }

        var document = new HtmlParser().ParseDocument(articleHtml);
        var headline = FirstText(
            document.QuerySelector("h1")?.TextContent,
            document.QuerySelector("meta[property='og:title']")?.GetAttribute("content"),
            document.QuerySelector("title")?.TextContent);
        var snippet = FirstText(
            document.QuerySelector("article p")?.TextContent,
            document.QuerySelector("p")?.TextContent,
            document.QuerySelector("meta[name='description']")?.GetAttribute("content"),
            document.QuerySelector("meta[property='og:description']")?.GetAttribute("content"));
        var publishedRaw = FirstText(
            document.QuerySelector("time[datetime]")?.GetAttribute("datetime"),
            document.QuerySelector("meta[property='article:published_time']")?.GetAttribute("content"));
        DateTimeOffset? publishedAt = DateTimeOffset.TryParse(publishedRaw, out var parsed) ? parsed : null;

        return (
            HtmlText.Truncate(headline, MaxHeadlineChars),
            HtmlText.Truncate(snippet, MaxSnippetChars),
            ExtractBody(articleHtml),
            publishedAt);
    }

    public static string ExtractBody(string html)
    {
        if (string.IsNullOrWhiteSpace(html))
        {
            return "";
        }

        var document = new HtmlParser().ParseDocument(html);
        var paragraphs = document.QuerySelectorAll("article p");
        if (paragraphs.Length == 0)
        {
            paragraphs = document.QuerySelectorAll("p");
        }

        var parts = new List<string>();
        foreach (var paragraph in paragraphs)
        {
            var text = HtmlText.ToPlainText(paragraph.TextContent);
            if (!string.IsNullOrWhiteSpace(text))
            {
                parts.Add(text);
            }
        }

        if (parts.Count == 0)
        {
            return "";
        }

        return HtmlText.Truncate(string.Join("\n\n", parts), MaxBodyChars);
    }

    internal static bool LooksLikeEpaperLink(Uri uri)
    {
        var host = uri.Host;
        if (host.StartsWith("epaper.", StringComparison.OrdinalIgnoreCase)
            || host.Contains(".epaper.", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        var path = uri.AbsolutePath;
        if (path.Contains("/epaper", StringComparison.OrdinalIgnoreCase)
            || path.Contains("e-paper", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return uri.Query.Contains("ed_code=", StringComparison.OrdinalIgnoreCase);
    }

    internal static bool LooksLikeEpaperHeadline(string? headline)
    {
        if (string.IsNullOrWhiteSpace(headline))
        {
            return false;
        }

        return headline.Contains("epaper", StringComparison.OrdinalIgnoreCase)
            || headline.Contains("e-paper", StringComparison.OrdinalIgnoreCase)
            || headline.Contains("ई-पेपर", StringComparison.Ordinal)
            || headline.Contains("ई पेपर", StringComparison.Ordinal);
    }

    internal static bool LooksLikeArticleLink(Uri uri)
    {
        if (LooksLikeEpaperLink(uri))
        {
            return false;
        }

        var path = uri.AbsolutePath;
        if (path.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (path.Contains("/news/", StringComparison.OrdinalIgnoreCase)
            || path.Contains("/story", StringComparison.OrdinalIgnoreCase)
            || path.Contains("/article", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        // Amar Ujala city list cards: /city/story-1
        if (CityStoryPath().IsMatch(path))
        {
            return true;
        }

        return StoryIdPattern().IsMatch(path);
    }

    internal static bool LooksLikeNavLink(Uri uri)
    {
        var segments = uri.AbsolutePath.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries);
        return segments.Length <= 1;
    }

    private static string? TryStoryId(Uri uri)
    {
        var match = StoryIdPattern().Match(uri.AbsolutePath);
        return match.Success ? match.Groups[1].Value : null;
    }

    private static string FirstText(params string?[] candidates)
    {
        foreach (var candidate in candidates)
        {
            var text = HtmlText.ToPlainText(candidate);
            if (!string.IsNullOrWhiteSpace(text))
            {
                return text;
            }
        }

        return "";
    }

    [GeneratedRegex(@"(\d{6,})(?:\.html)?/?$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex StoryIdPattern();

    [GeneratedRegex(@"/city/[^/]+", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex CityStoryPath();
}
