namespace NewsFeed.Api;

/// <summary>
/// CORS allowlist: configured origins plus HTTPS preview hosts for our Pages projects.
/// Never used as AllowAnyOrigin.
/// </summary>
public static class CorsOrigin
{
    public static bool IsAllowed(string? origin, IReadOnlyList<string> configured)
    {
        if (string.IsNullOrWhiteSpace(origin))
        {
            return false;
        }

        foreach (var allowed in configured)
        {
            if (string.Equals(origin.TrimEnd('/'), allowed.TrimEnd('/'), StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)
            || !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase)
            || !uri.IsDefaultPort)
        {
            return false;
        }

        if (uri.AbsolutePath is not ("/" or "") || !string.IsNullOrEmpty(uri.Query) || !string.IsNullOrEmpty(uri.Fragment))
        {
            return false;
        }

        var host = uri.Host;
        return IsPagesProjectHost(host, "tazakhabar-web.pages.dev")
            || IsPagesProjectHost(host, "tazakhabar-admin.pages.dev");
    }

    private static bool IsPagesProjectHost(string host, string apex) =>
        host.Equals(apex, StringComparison.OrdinalIgnoreCase)
        || host.EndsWith("." + apex, StringComparison.OrdinalIgnoreCase);
}
