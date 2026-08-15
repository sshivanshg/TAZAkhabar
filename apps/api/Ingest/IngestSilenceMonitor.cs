using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NewsFeed.Api.Data;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Ingest;

public sealed class IngestSilenceMonitor(
    IServiceScopeFactory scopeFactory,
    IHttpClientFactory httpClientFactory,
    IOptions<IngestHealthOptions> options,
    ILogger<IngestSilenceMonitor> logger) : BackgroundService
{
    private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(15);
    private DateTimeOffset? _lastAlertAt;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(CheckInterval);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await CheckAsync(stoppingToken);
        }
    }

    private async Task CheckAsync(CancellationToken ct)
    {
        var settings = options.Value;
        var maxSilence = TimeSpan.FromMinutes(Math.Max(15, settings.MaxSilenceMinutes));
        var now = DateTimeOffset.UtcNow;

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var activeSourceCount = await db.Sources
            .AsNoTracking()
            .CountAsync(s => s.IsActive && (s.Type == SourceType.Rss || s.Type == SourceType.Scrape), ct);
        if (activeSourceCount == 0)
        {
            return;
        }

        var lastSuccess = await db.IngestionRuns
            .AsNoTracking()
            .Where(r => r.CompletedAt != null
                && r.ErrorSummary == null
                && r.Source.IsActive
                && (r.Source.Type == SourceType.Rss || r.Source.Type == SourceType.Scrape))
            .MaxAsync(r => (DateTimeOffset?)r.CompletedAt, ct);

        if (lastSuccess is not null && now - lastSuccess <= maxSilence)
        {
            return;
        }

        if (_lastAlertAt is not null && now - _lastAlertAt < maxSilence)
        {
            return;
        }

        _lastAlertAt = now;
        logger.LogWarning(
            "Ingest silence alert: no successful active-source ingestion run since {LastSuccessUtc}; active sources {ActiveSourceCount}; threshold minutes {ThresholdMinutes}",
            lastSuccess,
            activeSourceCount,
            settings.MaxSilenceMinutes);

        if (string.IsNullOrWhiteSpace(settings.AlertWebhookUrl))
        {
            return;
        }

        try
        {
            var client = httpClientFactory.CreateClient("alerts");
            await client.PostAsJsonAsync(
                settings.AlertWebhookUrl,
                new
                {
                    type = "ingest_silence",
                    lastSuccessUtc = lastSuccess,
                    activeSourceCount,
                    thresholdMinutes = settings.MaxSilenceMinutes,
                    observedAtUtc = now,
                },
                ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send ingest silence alert webhook");
        }
    }
}
