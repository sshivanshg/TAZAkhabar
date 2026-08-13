namespace NewsFeed.Api.Ingest;

public sealed class PdfProcessingWorker(
    PdfProcessingQueue queue,
    IServiceScopeFactory scopeFactory,
    ILogger<PdfProcessingWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var uploadId in queue.ReadAllAsync(stoppingToken))
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<PdfIngestService>();
                await service.ProcessUploadAsync(uploadId, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "PDF processing failed for upload {UploadId}", uploadId);
            }
        }
    }
}
