using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class FakeScrapeHttpClient : IScrapeHttpClient
{
    public Dictionary<string, string> Responses { get; } = new(StringComparer.Ordinal);

    public Task<string> GetStringAsync(Uri uri, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(uri);
        ct.ThrowIfCancellationRequested();
        if (!Responses.TryGetValue(uri.AbsoluteUri, out var html))
        {
            throw new HttpRequestException($"No fixture HTML mapped for {uri.AbsoluteUri}");
        }

        return Task.FromResult(html);
    }
}
