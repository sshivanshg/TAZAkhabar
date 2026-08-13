using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Ingest;

public sealed class PdfIngestService(
    AppDbContext db,
    PdfProcessingQueue queue,
    IArticleIntelligence intelligence,
    IOptions<UploadOptions> options,
    ILogger<PdfIngestService> logger)
{
    public const int DefaultCityId = 2;

    public async Task<DocumentUpload> EnqueueAsync(
        Stream file,
        string fileName,
        string contentType,
        int? cityHintId,
        string uploadedBy,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(file);

        var settings = options.Value;
        if (string.IsNullOrWhiteSpace(settings.RootPath))
        {
            throw new InvalidOperationException("Upload:RootPath is not configured.");
        }

        var mediaType = NormalizeMediaType(contentType);
        if (!IsPdf(mediaType) && !IsImage(mediaType))
        {
            throw new InvalidOperationException($"Unsupported content type '{contentType}'.");
        }

        Directory.CreateDirectory(settings.RootPath);
        var original = SanitizeFileName(fileName);
        var ext = Path.GetExtension(original);
        if (string.IsNullOrEmpty(ext))
        {
            ext = IsPdf(mediaType) ? ".pdf" : ".bin";
        }

        var storedPath = Path.Combine(settings.RootPath, $"{Guid.NewGuid():N}{ext}");
        long byteSize;
        try
        {
            byteSize = await CopyWithLimitAsync(file, storedPath, settings.MaxBytes, ct);
        }
        catch
        {
            if (File.Exists(storedPath))
            {
                File.Delete(storedPath);
            }

            throw;
        }

        var upload = new DocumentUpload
        {
            OriginalFileName = original,
            StoredPath = storedPath,
            ContentType = HtmlText.Truncate(mediaType, 127),
            ByteSize = byteSize,
            CityHintId = cityHintId,
            Status = DocumentUploadStatus.Queued,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        db.DocumentUploads.Add(upload);
        await db.SaveChangesAsync(ct);
        await queue.EnqueueAsync(upload.Id, ct);
        logger.LogInformation(
            "Queued document upload {UploadId} ({FileName}) by {UploadedBy}",
            upload.Id,
            original,
            uploadedBy);
        return upload;
    }

    public async Task ProcessUploadAsync(int id, CancellationToken ct)
    {
        var upload = await db.DocumentUploads.FirstOrDefaultAsync(d => d.Id == id, ct)
            ?? throw new InvalidOperationException($"Document upload {id} not found.");

        upload.Status = DocumentUploadStatus.Processing;
        upload.ErrorSummary = null;
        await db.SaveChangesAsync(ct);

        IngestionRun? run = null;
        Source? source = null;
        try
        {
            var preferredInboxCityId = upload.CityHintId ?? DefaultCityId;
            source = await db.Sources.FirstOrDefaultAsync(
                    s => s.Type == SourceType.PdfUpload && s.CityId == preferredInboxCityId, ct)
                ?? await db.Sources.FirstOrDefaultAsync(
                    s => s.Type == SourceType.PdfUpload && s.CityId == DefaultCityId, ct);

            if (source is null)
            {
                await FailAsync(upload, null, null, $"PDF inbox source not found for city {preferredInboxCityId}.", ct);
                return;
            }

            run = new IngestionRun
            {
                SourceId = source.Id,
                StartedAt = DateTimeOffset.UtcNow,
            };
            db.IngestionRuns.Add(run);
            await db.SaveChangesAsync(ct);

            upload.SourceId = source.Id;
            upload.IngestionRunId = run.Id;
            await db.SaveChangesAsync(ct);

            var hintCity = upload.CityHintId is int hintId
                ? await db.Cities.AsNoTracking().FirstOrDefaultAsync(c => c.Id == hintId, ct)
                : null;

            var stories = await ExtractStoriesAsync(upload, hintCity?.Slug, ct);
            if (stories is null)
            {
                return;
            }

            run.ArticlesFound = stories.Count;
            var inserted = 0;
            var skipped = 0;
            foreach (var story in stories)
            {
                if (await TryInsertAsync(upload, source, story, hintCity, source.CityId, ct))
                {
                    inserted++;
                }
                else
                {
                    skipped++;
                }
            }

            run.ArticlesAdded = inserted;
            run.ArticlesSkipped = skipped;

            if (inserted == 0)
            {
                await FailAsync(upload, source, run, "No stories could be extracted from the upload.", ct);
                return;
            }

            upload.Status = DocumentUploadStatus.Ready;
            upload.ErrorSummary = null;
            upload.ProcessedAt = DateTimeOffset.UtcNow;
            await CompleteRunAsync(source, run, FetchStatus.Success, null, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "PDF ingest failed for upload {UploadId}", id);
            db.ChangeTracker.Clear();
            var trackedUpload = await db.DocumentUploads.FirstAsync(d => d.Id == id, CancellationToken.None);
            var trackedRun = run is null
                ? null
                : await db.IngestionRuns.FirstOrDefaultAsync(r => r.Id == run.Id, CancellationToken.None);
            var trackedSource = source is null
                ? null
                : await db.Sources.FirstOrDefaultAsync(s => s.Id == source.Id, CancellationToken.None);
            await FailAsync(trackedUpload, trackedSource, trackedRun, ex.Message, CancellationToken.None);
        }
    }

    private async Task<IReadOnlyList<ExtractedStory>?> ExtractStoriesAsync(
        DocumentUpload upload,
        string? cityHintSlug,
        CancellationToken ct)
    {
        var settings = options.Value;
        if (IsImage(upload.ContentType))
        {
            var bytes = await File.ReadAllBytesAsync(upload.StoredPath, ct);
            return await intelligence.ExtractStoriesFromImageAsync(bytes, upload.ContentType, cityHintSlug, ct);
        }

        if (!IsPdf(upload.ContentType))
        {
            await FailCurrentAsync(upload, $"Unsupported content type '{upload.ContentType}'.", ct);
            return null;
        }

        await using var stream = File.OpenRead(upload.StoredPath);
        var extracted = PdfTextExtractor.Extract(stream);
        if (extracted.PageCount > settings.MaxPages)
        {
            await FailCurrentAsync(upload, $"PDF exceeds the {settings.MaxPages} page limit.", ct);
            return null;
        }

        if (extracted.Text.Trim().Length < 80)
        {
            await FailCurrentAsync(
                upload,
                "PDF text is too thin to extract. Upload a clearer scan or page images (jpeg/png/webp).",
                ct);
            return null;
        }

        return await intelligence.ExtractStoriesAsync(extracted.Text, cityHintSlug, ct);
    }

    private async Task FailCurrentAsync(DocumentUpload upload, string error, CancellationToken ct)
    {
        var source = upload.SourceId is int sourceId
            ? await db.Sources.FirstOrDefaultAsync(s => s.Id == sourceId, ct)
            : null;
        var run = upload.IngestionRunId is int runId
            ? await db.IngestionRuns.FirstOrDefaultAsync(r => r.Id == runId, ct)
            : null;
        await FailAsync(upload, source, run, error, ct);
    }

    private async Task<bool> TryInsertAsync(
        DocumentUpload upload,
        Source source,
        ExtractedStory story,
        City? hintCity,
        int inboxCityId,
        CancellationToken ct)
    {
        var headline = HtmlText.Truncate((story.Headline ?? "").Trim(), 300);
        if (string.IsNullOrWhiteSpace(headline))
        {
            return false;
        }

        var cityId = hintCity?.Id ?? await ResolveCityIdAsync(story, inboxCityId, ct);
        var sourceUrl = BuildSourceUrl(upload.Id, headline, cityId);
        if (await db.Articles.AnyAsync(a => a.SourceUrl == sourceUrl, ct))
        {
            return false;
        }

        var now = DateTimeOffset.UtcNow;
        var article = new Article
        {
            CityId = cityId,
            Headline = headline,
            Summary = HtmlText.Truncate(story.Summary ?? "", 1000),
            SourceName = "PDF upload",
            SourceUrl = sourceUrl,
            PublishedAt = now,
            Category = string.IsNullOrWhiteSpace(story.Category) ? "Local" : story.Category,
            Status = ArticleStatus.PendingReview,
            IsMock = false,
            IngestedAt = now,
            SourceId = source.Id,
            DocumentUploadId = upload.Id,
        };

        db.Articles.Add(article);
        try
        {
            await db.SaveChangesAsync(ct);
            return true;
        }
        catch (DbUpdateException)
        {
            db.Entry(article).State = EntityState.Detached;
            return false;
        }
    }

    private async Task<int> ResolveCityIdAsync(ExtractedStory story, int inboxCityId, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(story.CitySlug))
        {
            var bySlug = await db.Cities.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Slug == story.CitySlug, ct);
            if (bySlug is not null)
            {
                return bySlug.Id;
            }
        }

        var detected = PlaceNameMatcher.DetectCitySlug(story.Headline, story.Summary);
        if (detected is not null)
        {
            var byDetect = await db.Cities.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Slug == detected, ct);
            if (byDetect is not null)
            {
                return byDetect.Id;
            }
        }

        return inboxCityId;
    }

    private async Task FailAsync(
        DocumentUpload upload,
        Source? source,
        IngestionRun? run,
        string error,
        CancellationToken ct)
    {
        var summary = HtmlText.Truncate(error, 1000);
        upload.Status = DocumentUploadStatus.Failed;
        upload.ErrorSummary = summary;
        upload.ProcessedAt = DateTimeOffset.UtcNow;
        if (run is not null)
        {
            run.ArticlesFailed = Math.Max(run.ArticlesFailed, 1);
            run.ErrorSummary = summary;
            if (source is not null)
            {
                await CompleteRunAsync(source, run, FetchStatus.Error, summary, ct);
                return;
            }

            run.CompletedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task CompleteRunAsync(
        Source source,
        IngestionRun run,
        FetchStatus status,
        string? error,
        CancellationToken cancellationToken)
    {
        run.CompletedAt = DateTimeOffset.UtcNow;
        source.LastFetchedAt = run.CompletedAt;
        source.LastFetchStatus = status;
        source.LastErrorMessage = error;
        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task<long> CopyWithLimitAsync(
        Stream source,
        string destinationPath,
        long maxBytes,
        CancellationToken ct)
    {
        await using var dest = File.Create(destinationPath);
        var buffer = new byte[81_920];
        long total = 0;
        int read;
        while ((read = await source.ReadAsync(buffer.AsMemory(0, buffer.Length), ct)) > 0)
        {
            total += read;
            if (total > maxBytes)
            {
                throw new InvalidOperationException($"File exceeds MaxBytes ({maxBytes}).");
            }

            await dest.WriteAsync(buffer.AsMemory(0, read), ct);
        }

        return total;
    }

    internal static string BuildSourceUrl(int uploadId, string headline, int cityId)
    {
        var normalized = NormalizeHeadline(headline) + cityId;
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(normalized)))
            .ToLowerInvariant();
        return $"pdf://upload/{uploadId}/{hash}";
    }

    private static string NormalizeHeadline(string headline) =>
        string.Join(' ', headline.Trim().ToLowerInvariant()
            .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

    private static string SanitizeFileName(string fileName)
    {
        var name = Path.GetFileName(fileName);
        if (string.IsNullOrWhiteSpace(name))
        {
            name = "upload.bin";
        }

        return HtmlText.Truncate(name, 260);
    }

    private static bool IsPdf(string contentType) =>
        NormalizeMediaType(contentType) == "application/pdf";

    private static bool IsImage(string contentType)
    {
        var type = NormalizeMediaType(contentType);
        return type is "image/jpeg" or "image/jpg" or "image/png" or "image/webp";
    }

    private static string NormalizeMediaType(string? contentType) =>
        (contentType ?? "").Split(';')[0].Trim().ToLowerInvariant();
}
