using System.Net;
using System.Net.Sockets;

namespace NewsFeed.Api.Ingest;

public static class SafeHttp
{
    public static bool TryValidatePublicAbsoluteUri(string? url, out Uri uri, out string error)
    {
        uri = null!;
        error = "";

        if (string.IsNullOrWhiteSpace(url))
        {
            error = "URL is required.";
            return false;
        }

        if (!Uri.TryCreate(url.Trim(), UriKind.Absolute, out var parsed) || parsed is null)
        {
            error = "URL must be an absolute http(s) URI.";
            return false;
        }

        if (parsed.Scheme != Uri.UriSchemeHttp && parsed.Scheme != Uri.UriSchemeHttps)
        {
            error = "Only http and https URLs are allowed.";
            return false;
        }

        var host = parsed.DnsSafeHost;
        if (string.IsNullOrWhiteSpace(host))
        {
            error = "URL host is required.";
            return false;
        }

        if (IsLocalhostHost(host))
        {
            error = "Localhost URLs are not allowed.";
            return false;
        }

        if (IPAddress.TryParse(host, out var address) && IsBlockedAddress(address))
        {
            error = "Private, loopback, and link-local addresses are not allowed.";
            return false;
        }

        uri = parsed;
        return true;
    }

    private static bool IsLocalhostHost(string host) =>
        host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
        || host.Equals("localhost.", StringComparison.OrdinalIgnoreCase)
        || host.EndsWith(".localhost", StringComparison.OrdinalIgnoreCase)
        || host.EndsWith(".localhost.", StringComparison.OrdinalIgnoreCase);

    private static bool IsBlockedAddress(IPAddress address)
    {
        if (address.IsIPv4MappedToIPv6)
        {
            address = address.MapToIPv4();
        }

        if (IPAddress.IsLoopback(address) || address.Equals(IPAddress.None) || address.Equals(IPAddress.Any)
            || address.Equals(IPAddress.IPv6Any) || address.Equals(IPAddress.Broadcast))
        {
            return true;
        }

        if (address.IsIPv6LinkLocal || address.IsIPv6SiteLocal || address.IsIPv6Multicast)
        {
            return true;
        }

        var bytes = address.GetAddressBytes();
        if (address.AddressFamily == AddressFamily.InterNetworkV6)
        {
            // Unique local fc00::/7
            return bytes.Length > 0 && (bytes[0] & 0xFE) == 0xFC;
        }

        if (address.AddressFamily != AddressFamily.InterNetwork || bytes.Length < 2)
        {
            return true;
        }

        // 0.0.0.0/8, 10.0.0.0/8, 127.0.0.0/8
        if (bytes[0] is 0 or 10 or 127)
        {
            return true;
        }

        // 169.254.0.0/16 link-local, 192.168.0.0/16
        if ((bytes[0] == 169 && bytes[1] == 254) || (bytes[0] == 192 && bytes[1] == 168))
        {
            return true;
        }

        // 172.16.0.0/12
        if (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31)
        {
            return true;
        }

        // 100.64.0.0/10 CGNAT
        return bytes[0] == 100 && bytes[1] >= 64 && bytes[1] <= 127;
    }
}
