using Microsoft.Extensions.Options;
using NewsFeed.Api.Dtos;
using NewsFeed.Api.Ingest;
using NewsFeed.Api.Options;
using NewsFeed.Api.Services;

namespace NewsFeed.Api.Endpoints;

public static class MaintenanceEndpoints
{
    public static RouteGroupBuilder MapMaintenanceEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/maintenance/purge-old-articles", async (
                HttpContext http,
                ArticlePurgeService purge,
                IOptions<RssIngestOptions> ingestOptions,
                CancellationToken cancellationToken) =>
            {
                if (!IngestKeyAuth.Matches(
                        http.Request.Headers["X-Ingest-Key"].ToString(),
                        ingestOptions.Value.Secret))
                {
                    return Results.Problem(
                        title: "Unauthorized",
                        detail: "Invalid or missing ingest key.",
                        statusCode: StatusCodes.Status401Unauthorized);
                }

                var deleted = await purge.PurgeAsync(cancellationToken);
                return Results.Ok(new PurgeOldArticlesResponse(deleted));
            })
            .WithName("PurgeOldArticles")
            .WithOpenApi()
            .Produces<PurgeOldArticlesResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        return api;
    }
}
