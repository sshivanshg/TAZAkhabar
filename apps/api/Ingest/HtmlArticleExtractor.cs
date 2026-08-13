using AngleSharp.Html.Parser;

namespace NewsFeed.Api.Ingest;

public static class HtmlArticleExtractor
{
    private const int MaxHeadlineChars = 300;
    private const int MaxSnippetChars = 400;

    public static IReadOnlyList<Uri> ExtractArticleLinks(string listHtml, Uri baseUri, int maxLinks)
    {
        if (string.IsNullOrWhiteSpace(listHtml) || maxLinks <= 0)
        {
            return [];
        }

        var document = new HtmlParser().ParseDocument(listHtml);
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var links = new List<Uri>();

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

            if (!seen.Add(safe.AbsoluteUri))
            {
                continue;
            }

            links.Add(safe);
            if (links.Count >= maxLinks)
            {
                break;
            }
        }

        return links;
    }

    public static (string Headline, string Snippet, DateTimeOffset? PublishedAt) ExtractArticle(string articleHtml)
    {
        if (string.IsNullOrWhiteSpace(articleHtml))
        {
            return ("", "", null);
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
            publishedAt);
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
}
