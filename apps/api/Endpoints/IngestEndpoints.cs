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
                CancellationToken cancellationToken) =>
            {
                if (!IngestKeyAuth.Matches(http.Request.Headers["X-Ingest-Key"].ToString(), options.Value.Secret))
                {
                    return Results.Problem(
                        title: "Unauthorized",
                        detail: "Invalid or missing ingest key.",
                        statusCode: StatusCodes.Status401Unauthorized);
                }

                var result = await ingest.RunAsync(cancellationToken);
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
                CancellationToken cancellationToken) =>
            {
                if (!IngestKeyAuth.Matches(http.Request.Headers["X-Ingest-Key"].ToString(), options.Value.Secret))
                {
                    return Results.Problem(
                        title: "Unauthorized",
                        detail: "Invalid or missing ingest key.",
                        statusCode: StatusCodes.Status401Unauthorized);
                }

                var result = await ingest.RunAllActiveAsync(cancellationToken);
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

        return api;
    }
}
