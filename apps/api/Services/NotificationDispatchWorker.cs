namespace NewsFeed.Api.Services;

public sealed class NotificationDispatchWorker(
    NotificationDispatchQueue queue,
    NotificationDispatchService dispatcher,
    ILogger<NotificationDispatchWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var item in queue.DequeueAllAsync(stoppingToken))
        {
            try
            {
                await dispatcher.DispatchArticleAsync(item.ArticleId, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Notification dispatch worker failed for article {ArticleId}", item.ArticleId);
            }
        }
    }
}
