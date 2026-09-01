using Microsoft.Extensions.Options;
using NewsFeed.Api.Dtos;
using NewsFeed.Api.Ingest;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Endpoints;

public static class IngestEndpoints
{
    public static RouteGroupBuilder MapIngestEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/ingest/rss", async (
                HttpContext http,
                RssIngestService ingest,
                IOptions<RssIngestOptions> options,
                int? maxSources,
                CancellationToken cancellationToken) =>
            {
                if (!IngestKeyAuth.Matches(http.Request.Headers["X-Ingest-Key"].ToString(), options.Value.Secret))
                {
                    return Results.Problem(
                        title: "Unauthorized",
                        detail: "Invalid or missing ingest key.",
                        statusCode: StatusCodes.Status401Unauthorized);
                }

                var result = await ingest.RunAsync(
                    cancellationToken,
                    useIntelligence: false,
                    autoPublish: true,
                    fetchArticleBodies: false,
                    maxSources: maxSources);
                return Results.Ok(new IngestRunResponse(
                    result.FeedsAttempted,
                    result.FeedsFailed,
                    result.Inserted,
                    result.Skipped));
            })
            .WithName("IngestRss")
            .WithOpenApi()
            .Produces<IngestRunResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        api.MapPost("/ingest/scrape", async (
                HttpContext http,
                ScrapeIngestService ingest,
                IOptions<RssIngestOptions> options,
                IOptions<OpenAiRewriteOptions> rewriteOptions,
                bool? useRewrite,
                CancellationToken cancellationToken) =>
            {
                if (!IngestKeyAuth.Matches(http.Request.Headers["X-Ingest-Key"].ToString(), options.Value.Secret))
                {
                    return Results.Problem(
                        title: "Unauthorized",
                        detail: "Invalid or missing ingest key.",
                        statusCode: StatusCodes.Status401Unauthorized);
                }

                var rewrite = useRewrite
                    ?? (rewriteOptions.Value.Enabled
                        && !string.IsNullOrWhiteSpace(rewriteOptions.Value.ApiKey));
                var result = await ingest.RunAllActiveAsync(cancellationToken, useRewrite: rewrite);
                return Results.Ok(new IngestRunResponse(
                    result.FeedsAttempted,
                    result.FeedsFailed,
                    result.Inserted,
                    result.Skipped));
            })
            .WithName("IngestScrape")
            .WithOpenApi()
            .Produces<IngestRunResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        api.MapPost("/ingest/daily", async (
                HttpContext http,
                RssIngestService rssIngest,
                ScrapeIngestService scrapeIngest,
                IOptions<RssIngestOptions> options,
                CancellationToken cancellationToken) =>
            {
                if (!IngestKeyAuth.Matches(http.Request.Headers["X-Ingest-Key"].ToString(), options.Value.Secret))
                {
                    return Results.Problem(
                        title: "Unauthorized",
                        detail: "Invalid or missing ingest key.",
                        statusCode: StatusCodes.Status401Unauthorized);
                }

                var rss = await rssIngest.RunAsync(
                    cancellationToken,
                    useIntelligence: false,
                    autoPublish: true,
                    fetchArticleBodies: false);
                var scrape = await scrapeIngest.RunAllActiveAsync(cancellationToken, useRewrite: false);
                return Results.Ok(new IngestRunResponse(
                    rss.FeedsAttempted + scrape.FeedsAttempted,
                    rss.FeedsFailed + scrape.FeedsFailed,
                    rss.Inserted + scrape.Inserted,
                    rss.Skipped + scrape.Skipped));
            })
            .WithName("IngestDaily")
            .WithOpenApi()
            .Produces<IngestRunResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        api.MapPost("/ingest/backfill-bodies", async (
                HttpContext http,
                ArticleBodyBackfillService backfill,
                IOptions<RssIngestOptions> options,
                int? take,
                int? afterId,
                CancellationToken cancellationToken) =>
            {
                if (!IngestKeyAuth.Matches(http.Request.Headers["X-Ingest-Key"].ToString(), options.Value.Secret))
                {
                    return Results.Problem(
                        title: "Unauthorized",
                        detail: "Invalid or missing ingest key.",
                        statusCode: StatusCodes.Status401Unauthorized);
                }

                var result = await backfill.RunAsync(take ?? 50, afterId ?? 0, cancellationToken);
                return Results.Ok(new ArticleBodyBackfillResponse(
                    result.Examined,
                    result.Updated,
                    result.Skipped,
                    result.Failed,
                    result.NextAfterId));
            })
            .WithName("IngestBackfillBodies")
            .WithOpenApi()
            .Produces<ArticleBodyBackfillResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        api.MapPost("/ingest/backfill-source-urls", async (
                HttpContext http,
                ArticleSourceUrlBackfillService backfill,
                IOptions<RssIngestOptions> options,
                int? take,
                int? afterId,
                CancellationToken cancellationToken) =>
            {
                if (!IngestKeyAuth.Matches(http.Request.Headers["X-Ingest-Key"].ToString(), options.Value.Secret))
                {
                    return Results.Problem(
                        title: "Unauthorized",
                        detail: "Invalid or missing ingest key.",
                        statusCode: StatusCodes.Status401Unauthorized);
                }

                var result = await backfill.RunAsync(take ?? 40, afterId ?? 0, cancellationToken);
                return Results.Ok(new ArticleSourceUrlBackfillResponse(
                    result.Examined,
                    result.Updated,
                    result.Skipped,
                    result.Failed,
                    result.NextAfterId));
            })
            .WithName("IngestBackfillSourceUrls")
            .WithOpenApi()
            .Produces<ArticleSourceUrlBackfillResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        return api;
    }
}
