using System.Xml.Linq;

namespace NewsFeed.Api.Ingest;

public static class RssFeedParser
{
    public static IReadOnlyList<ParsedRssItem> Parse(string xml)
    {
        XDocument doc;
        try
        {
            doc = XDocument.Parse(xml);
        }
        catch
        {
            return [];
        }

        var items = new List<ParsedRssItem>();
        foreach (var itemElement in doc.Descendants("item"))
        {
            var parsed = ParseItem(itemElement);
            if (parsed is not null)
            {
                items.Add(parsed);
            }
        }

        return items;
    }

    private static ParsedRssItem? ParseItem(XElement item)
    {
        var title = HtmlText.Truncate(HtmlText.ToPlainText(item.Element("title")?.Value), 300);
        if (string.IsNullOrWhiteSpace(title))
        {
            return null;
        }

        var sourceUrl = GetSourceUrl(item);
        if (string.IsNullOrWhiteSpace(sourceUrl))
        {
            return null;
        }

        var snippet = HtmlText.Truncate(HtmlText.ToPlainText(item.Element("description")?.Value), 400);
        var publishedAt = ParsePubDate(item.Element("pubDate")?.Value);
        var imageUrl = GetImageUrl(item);
        var sourceName = item.Element("source")?.Value?.Trim();

        return new ParsedRssItem(title, snippet, sourceUrl, publishedAt, imageUrl, sourceName);
    }

    private static string GetSourceUrl(XElement item)
    {
        var link = item.Element("link")?.Value?.Trim();
        if (!string.IsNullOrWhiteSpace(link))
        {
            return link;
        }

        return item.Element("guid")?.Value?.Trim() ?? "";
    }

    private static DateTimeOffset? ParsePubDate(string? pubDate)
    {
        if (string.IsNullOrWhiteSpace(pubDate))
        {
            return null;
        }

        return DateTimeOffset.TryParse(pubDate, out var parsed) ? parsed : null;
    }

    private static string? GetImageUrl(XElement item)
    {
        foreach (var enclosure in item.Elements("enclosure"))
        {
            var type = enclosure.Attribute("type")?.Value;
            if (type is not null && type.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            {
                var url = enclosure.Attribute("url")?.Value?.Trim();
                if (!string.IsNullOrWhiteSpace(url))
                {
                    return url;
                }
            }
        }

        return null;
    }
}
