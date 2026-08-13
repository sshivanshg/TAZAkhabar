using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Dtos;
using NewsFeed.Api.Ingest;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Endpoints;

public static class AdminUploadsEndpoints
{
    private const int PageSize = 20;

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
    };

    public static RouteGroupBuilder MapAdminUploadsEndpoints(this RouteGroupBuilder admin)
    {
        admin.MapPost("/uploads", async (
                HttpRequest request,
                ClaimsPrincipal user,
                PdfIngestService ingest,
                AppDbContext db,
                IOptions<UploadOptions> uploadOptions,
                CancellationToken cancellationToken) =>
            {
                if (!request.HasFormContentType)
                {
                    return Results.Problem(
                        title: "Invalid content type",
                        detail: "Expected multipart/form-data with a 'file' field.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var form = await request.ReadFormAsync(cancellationToken);
                var file = form.Files.GetFile("file");
                if (file is null || file.Length == 0)
                {
                    return Results.Problem(
                        title: "Missing file",
                        detail: "multipart field 'file' is required.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var mediaType = NormalizeMediaType(file.ContentType);
                if (!AllowedContentTypes.Contains(mediaType))
                {
                    return Results.Problem(
                        title: "Unsupported content type",
                        detail: "Allowed types: application/pdf, image/jpeg, image/png, image/webp.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var maxBytes = uploadOptions.Value.MaxBytes;
                if (file.Length > maxBytes)
                {
                    return Results.Problem(
                        title: "File too large",
                        detail: $"File exceeds MaxBytes ({maxBytes}).",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                int? cityHintId = null;
                var rawHint = form["cityHintId"].ToString();
                if (!string.IsNullOrWhiteSpace(rawHint))
                {
                    if (!int.TryParse(rawHint, out var parsed) || parsed < 1)
                    {
                        return Results.Problem(
                            title: "Invalid cityHintId",
                            detail: "cityHintId must be a positive integer.",
                            statusCode: StatusCodes.Status400BadRequest);
                    }

                    var cityExists = await db.Cities.AsNoTracking()
                        .AnyAsync(c => c.Id == parsed, cancellationToken);
                    if (!cityExists)
                    {
                        return Results.Problem(
                            title: "Unknown cityHintId",
                            detail: $"No city found with id '{parsed}'.",
                            statusCode: StatusCodes.Status400BadRequest);
                    }

                    cityHintId = parsed;
                }

                try
                {
                    await using var stream = file.OpenReadStream();
                    var upload = await ingest.EnqueueAsync(
                        stream,
                        file.FileName,
                        mediaType,
                        cityHintId,
                        EditorName(user),
                        cancellationToken);
                    return Results.Created(
                        $"/api/admin/uploads/{upload.Id}",
                        ToResponse(upload, articlesCreated: 0));
                }
                catch (InvalidOperationException ex)
                {
                    return Results.Problem(
                        title: "Invalid upload",
                        detail: ex.Message,
                        statusCode: StatusCodes.Status400BadRequest);
                }
            })
            .WithName("AdminCreateUpload")
            .DisableAntiforgery()
            .WithOpenApi()
            .Accepts<IFormFile>("multipart/form-data")
            .Produces<DocumentUploadResponseDto>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        admin.MapGet("/uploads", async (
                int? page,
                AppDbContext db,
                CancellationToken cancellationToken) =>
            {
                var pageNumber = page is null or < 1 ? 1 : page.Value;
                var query = db.DocumentUploads.AsNoTracking();
                var total = await query.CountAsync(cancellationToken);
                var entities = await query
                    .Include(d => d.Articles)
                    .OrderByDescending(d => d.CreatedAt)
                    .ThenByDescending(d => d.Id)
                    .Skip((pageNumber - 1) * PageSize)
                    .Take(PageSize)
                    .ToListAsync(cancellationToken);
                var items = entities.Select(d => ToResponse(d, d.Articles.Count)).ToList();

                return Results.Ok(new PagedDocumentUploadsResponse(items, total, pageNumber, PageSize));
            })
            .WithName("AdminListUploads")
            .WithOpenApi()
            .Produces<PagedDocumentUploadsResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        admin.MapGet("/uploads/{id:int}", async (
                int id,
                AppDbContext db,
                CancellationToken cancellationToken) =>
            {
                var upload = await db.DocumentUploads.AsNoTracking()
                    .Include(d => d.Articles)
                    .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
                if (upload is null)
                {
                    return Results.Problem(
                        title: "Upload not found",
                        detail: $"No upload found with id '{id}'.",
                        statusCode: StatusCodes.Status404NotFound);
                }

                return Results.Ok(ToResponse(upload, upload.Articles.Count));
            })
            .WithName("AdminGetUpload")
            .WithOpenApi()
            .Produces<DocumentUploadResponseDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return admin;
    }

    private static DocumentUploadResponseDto ToResponse(DocumentUpload d, int articlesCreated) =>
        new(
            d.Id,
            d.OriginalFileName,
            d.ContentType,
            d.ByteSize,
            d.CityHintId,
            d.Status.ToString(),
            d.ErrorSummary,
            d.IngestionRunId,
            d.CreatedAt,
            d.ProcessedAt,
            articlesCreated);

    private static string NormalizeMediaType(string? contentType) =>
        (contentType ?? "").Split(';')[0].Trim().ToLowerInvariant();

    private static string EditorName(ClaimsPrincipal user) =>
        user.Identity?.Name?.Trim()
        ?? user.FindFirstValue(ClaimTypes.Name)
        ?? "admin";
}
