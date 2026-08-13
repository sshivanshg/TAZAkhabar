using System.Threading.Channels;

namespace NewsFeed.Api.Ingest;

public sealed class PdfProcessingQueue
{
    private readonly Channel<int> _channel = Channel.CreateUnbounded<int>();

    public ValueTask EnqueueAsync(int documentUploadId, CancellationToken ct) =>
        _channel.Writer.WriteAsync(documentUploadId, ct);

    public IAsyncEnumerable<int> ReadAllAsync(CancellationToken ct) =>
        _channel.Reader.ReadAllAsync(ct);
}
