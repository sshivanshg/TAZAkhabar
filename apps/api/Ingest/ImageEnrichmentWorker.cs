namespace NewsFeed.Api.Ingest;

public sealed class ImageEnrichmentWorker(
    ImageEnrichmentQueue queue,
    IServiceScopeFactory scopeFactory,
    ILogger<ImageEnrichmentWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            using (var scope = scopeFactory.CreateScope())
            {
                var service = scope.ServiceProvider.GetRequiredService<ArticleImageEnrichmentService>();
                await service.EnqueueEligibleStartupAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            return;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Image enrichment startup sweep failed");
        }

        await foreach (var articleId in queue.ReadAllAsync(stoppingToken))
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<ArticleImageEnrichmentService>();
                await service.EnrichAsync(articleId, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Image enrichment failed for article {ArticleId}", articleId);
            }
        }
    }
}
