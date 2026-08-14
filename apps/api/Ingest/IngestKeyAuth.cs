using System.Security.Cryptography;
using System.Text;

namespace NewsFeed.Api.Ingest;

public static class IngestKeyAuth
{
    public static bool Matches(string provided, string configured)
    {
        if (string.IsNullOrEmpty(configured) || string.IsNullOrEmpty(provided))
        {
            return false;
        }

        var providedBytes = Encoding.UTF8.GetBytes(provided);
        var configuredBytes = Encoding.UTF8.GetBytes(configured);
        return providedBytes.Length == configuredBytes.Length
            && CryptographicOperations.FixedTimeEquals(providedBytes, configuredBytes);
    }
}
