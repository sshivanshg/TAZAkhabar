using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Ingest;

/// <summary>
/// Keeps feeds fresh without relying solely on Render crons or GitHub Actions.
/// Runs only when <see cref="IngestScheduleOptions.Enabled"/> is true and the ingest secret is configured.
/// </summary>
public sealed class ScheduledIngestHostedService(
    IServiceScopeFactory scopeFactory,
    IOptions<IngestScheduleOptions> scheduleOptions,
    IOptions<RssIngestOptions> ingestOptions,
    IOptions<OpenAiRewriteOptions> rewriteOptions,
    ILogger<ScheduledIngestHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var schedule = scheduleOptions.Value;
        if (!schedule.Enabled)
        {
            logger.Log((LogLevel)2, "Scheduled ingest is disabled (IngestSchedule__Enabled=false).");
            return;
        }

        if (string.IsNullOrWhiteSpace(ingestOptions.Value.Secret))
        {
            logger.LogWarning(
                "Scheduled ingest is enabled but RssIngest__Secret is empty; in-process scheduler will not run.");
            return;
        }

        var rssInterval = TimeSpan.FromMinutes(Math.Max(5, schedule.RssIntervalMinutes));
        var scrapeInterval = TimeSpan.FromMinutes(Math.Max(15, schedule.ScrapeIntervalMinutes));
        var rssMaxSources = Math.Max(1, schedule.RssMaxSourcesPerRun);

        logger.Log(
            (LogLevel)2,
            "Scheduled ingest started: RSS every {RssIntervalMinutes}m (max {RssMaxSources} sources), scrape every {ScrapeIntervalMinutes}m",
            rssInterval.TotalMinutes,
            rssMaxSources,
            scrapeInterval.TotalMinutes);

        await Task.WhenAll(
            RunRssLoopAsync(rssInterval, rssMaxSources, stoppingToken),
            RunScrapeLoopAsync(scrapeInterval, schedule, stoppingToken));
    }

    private async Task RunRssLoopAsync(TimeSpan interval, int maxSources, CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(interval);
        await RunRssBatchAsync(maxSources, stoppingToken);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await RunRssBatchAsync(maxSources, stoppingToken);
        }
    }

    private async Task RunScrapeLoopAsync(
        TimeSpan interval,
        IngestScheduleOptions schedule,
        CancellationToken stoppingToken)
    {
        await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);

        using var timer = new PeriodicTimer(interval);
        await RunScrapeBatchAsync(schedule, stoppingToken);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await RunScrapeBatchAsync(schedule, stoppingToken);
        }
    }

    private async Task RunRssBatchAsync(int maxSources, CancellationToken stoppingToken)
    {
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var rss = scope.ServiceProvider.GetRequiredService<RssIngestService>();
            var result = await rss.RunAsync(
                stoppingToken,
                useIntelligence: false,
                autoPublish: true,
                fetchArticleBodies: true,
                maxSources: maxSources);

            logger.Log(
                (LogLevel)2,
                "Scheduled RSS ingest finished: attempted {Attempted}, failed {Failed}, inserted {Inserted}, skipped {Skipped}",
                result.FeedsAttempted,
                result.FeedsFailed,
                result.Inserted,
                result.Skipped);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Scheduled RSS ingest batch failed");
        }
    }

    private async Task RunScrapeBatchAsync(IngestScheduleOptions schedule, CancellationToken stoppingToken)
    {
        try
        {
            var useRewrite = schedule.ScrapeUseRewriteWhenConfigured
                && rewriteOptions.Value.Enabled
                && !string.IsNullOrWhiteSpace(rewriteOptions.Value.ApiKey);

            await using var scope = scopeFactory.CreateAsyncScope();
            var scrape = scope.ServiceProvider.GetRequiredService<ScrapeIngestService>();
            var result = await scrape.RunAllActiveAsync(stoppingToken, useRewrite: useRewrite);

            logger.Log(
                (LogLevel)2,
                "Scheduled scrape ingest finished (rewrite={UseRewrite}): attempted {Attempted}, failed {Failed}, inserted {Inserted}, skipped {Skipped}",
                useRewrite,
                result.FeedsAttempted,
                result.FeedsFailed,
                result.Inserted,
                result.Skipped);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Scheduled scrape ingest batch failed");
        }
    }
}
