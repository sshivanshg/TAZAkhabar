using System.Security.Cryptography;
using System.Text;
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
                if (!IngestKeyMatches(http.Request.Headers["X-Ingest-Key"].ToString(), options.Value.Secret))
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

        api.MapPost("/ingest/scrape", (
                HttpContext http,
                IOptions<RssIngestOptions> options) =>
            {
                if (!IngestKeyMatches(http.Request.Headers["X-Ingest-Key"].ToString(), options.Value.Secret))
                {
                    return Results.Problem(
                        title: "Unauthorized",
                        detail: "Invalid or missing ingest key.",
                        statusCode: StatusCodes.Status401Unauthorized);
                }

                return Results.Problem(
                    title: "Gone",
                    detail: "In-process HTML scrape is retired. Start apps/ingestion_engine and use admin Sources → Run now (or the worker CLI).",
                    statusCode: StatusCodes.Status410Gone);
            })
            .WithName("IngestScrape")
            .WithOpenApi()
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status410Gone)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        api.MapGet("/ingest/sources", async (
                HttpContext http,
                ExternalArticleIngestService ingest,
                IOptions<RssIngestOptions> options,
                int? id,
                string? type,
                CancellationToken cancellationToken) =>
            {
                if (!IngestKeyMatches(http.Request.Headers["X-Ingest-Key"].ToString(), options.Value.Secret))
                {
                    return Results.Problem(
                        title: "Unauthorized",
                        detail: "Invalid or missing ingest key.",
                        statusCode: StatusCodes.Status401Unauthorized);
                }

                if (!string.IsNullOrWhiteSpace(type)
                    && !string.Equals(type, "scrape", StringComparison.OrdinalIgnoreCase))
                {
                    return Results.Problem(
                        title: "Invalid type",
                        detail: "Only type=scrape is supported.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var payload = await ingest.ListScrapeSourcesAsync(id, cancellationToken);
                return Results.Ok(payload);
            })
            .WithName("IngestListSources")
            .WithOpenApi()
            .Produces<IngestSourcesResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        api.MapPost("/ingest/articles", async (
                HttpContext http,
                IngestArticlesRequest? body,
                ExternalArticleIngestService ingest,
                IOptions<RssIngestOptions> options,
                CancellationToken cancellationToken) =>
            {
                if (!IngestKeyMatches(http.Request.Headers["X-Ingest-Key"].ToString(), options.Value.Secret))
                {
                    return Results.Problem(
                        title: "Unauthorized",
                        detail: "Invalid or missing ingest key.",
                        statusCode: StatusCodes.Status401Unauthorized);
                }

                if (body?.Articles is null)
                {
                    return Results.Problem(
                        title: "Invalid body",
                        detail: "Request body with articles[] is required.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                try
                {
                    var result = await ingest.IngestAsync(body, cancellationToken);
                    return Results.Ok(result);
                }
                catch (ArgumentException ex)
                {
                    return Results.Problem(
                        title: "Invalid batch",
                        detail: ex.Message,
                        statusCode: StatusCodes.Status400BadRequest);
                }
            })
            .WithName("IngestArticles")
            .WithOpenApi()
            .Produces<IngestArticlesResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        return api;
    }

    private static bool IngestKeyMatches(string provided, string configured)
    {
        if (string.IsNullOrEmpty(configured) || string.IsNullOrEmpty(provided))
        {
            return false;
        }

        var providedBytes = Encoding.UTF8.GetBytes(provided);
        var configuredBytes = Encoding.UTF8.GetBytes(configured);
        return providedBytes.Length == configuredBytes.Length
            && CryptographicOperations.FixedTimeEquals(providedBytes, configuredBytes);
    }
}
