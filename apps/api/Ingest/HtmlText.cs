using System.Net;
using System.Text.RegularExpressions;

namespace NewsFeed.Api.Ingest;

public static partial class HtmlText
{
    [GeneratedRegex("<script[^>]*>.*?</script>", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex ScriptTagRegex();

    [GeneratedRegex("<style[^>]*>.*?</style>", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex StyleTagRegex();

    [GeneratedRegex("<[^>]+>")]
    private static partial Regex HtmlTagRegex();

    [GeneratedRegex(@"[\s]+")]
    private static partial Regex WhitespaceRegex();

    public static string ToPlainText(string? html)
    {
        if (string.IsNullOrWhiteSpace(html))
        {
            return "";
        }

        var text = ScriptTagRegex().Replace(html, " ");
        text = StyleTagRegex().Replace(text, " ");
        text = HtmlTagRegex().Replace(text, " ");
        text = WebUtility.HtmlDecode(text);
        text = WhitespaceRegex().Replace(text, " ");
        return text.Trim();
    }

    public static string Truncate(string text, int maxChars)
    {
        if (text.Length <= maxChars)
        {
            return text;
        }

        return text[..maxChars].TrimEnd();
    }
}
