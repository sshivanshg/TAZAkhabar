using System.Threading.Channels;

namespace NewsFeed.Api.Services;

public sealed record NotificationDispatchWorkItem(int ArticleId);

public sealed class NotificationDispatchQueue
{
    private readonly Channel<NotificationDispatchWorkItem> _channel =
        Channel.CreateUnbounded<NotificationDispatchWorkItem>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false,
        });

    public ValueTask EnqueueAsync(int articleId, CancellationToken cancellationToken)
    {
        return _channel.Writer.WriteAsync(new NotificationDispatchWorkItem(articleId), cancellationToken);
    }

    public IAsyncEnumerable<NotificationDispatchWorkItem> DequeueAllAsync(CancellationToken cancellationToken) =>
        _channel.Reader.ReadAllAsync(cancellationToken);
}
