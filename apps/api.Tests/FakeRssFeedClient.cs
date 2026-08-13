using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class FakeRssFeedClient : IRssFeedClient
{
    public Dictionary<string, string?> Responses { get; } = new(StringComparer.Ordinal);

    public Task<string?> FetchXmlAsync(string url, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        Responses.TryGetValue(url, out var xml);
        return Task.FromResult(xml);
    }
}
