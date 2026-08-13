using System.Threading.Channels;

namespace NewsFeed.Api.Ingest;

public sealed class ImageEnrichmentQueue
{
    private readonly Channel<int> _channel = Channel.CreateUnbounded<int>();

    public ValueTask EnqueueAsync(int articleId, CancellationToken ct) =>
        _channel.Writer.WriteAsync(articleId, ct);

    public IAsyncEnumerable<int> ReadAllAsync(CancellationToken ct) =>
        _channel.Reader.ReadAllAsync(ct);
}
