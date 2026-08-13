using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Ingest;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Tests;

public sealed class PdfIngestServiceTests
{
    [Fact]
    public async Task ProcessUpload_TextPdf_CreatesPendingReviewArticle()
    {
        await using var harness = CreateHarness();
        await using var pdf = File.OpenRead(FixturePath("hello.pdf"));

        var upload = await harness.Service.EnqueueAsync(
            pdf, "hello.pdf", "application/pdf", cityHintId: 2, "editor", CancellationToken.None);

        Assert.Equal(DocumentUploadStatus.Queued, upload.Status);

        await harness.Service.ProcessUploadAsync(upload.Id, CancellationToken.None);

        var stored = Assert.Single(await harness.Db.Articles.IgnoreQueryFilters().ToListAsync());
        Assert.Equal("From PDF", stored.Headline);
        Assert.Equal("Summary line for review.", stored.Summary);
        Assert.Equal("PDF upload", stored.SourceName);
        Assert.Equal(ArticleStatus.PendingReview, stored.Status);
        Assert.False(stored.IsMock);
        Assert.Equal(upload.Id, stored.DocumentUploadId);
        Assert.Equal(2, stored.CityId);
        Assert.Equal(5, stored.SourceId);
        Assert.NotNull(stored.IngestedAt);
        Assert.StartsWith($"pdf://upload/{upload.Id}/", stored.SourceUrl, StringComparison.Ordinal);

        var processed = await harness.Db.DocumentUploads.SingleAsync(d => d.Id == upload.Id);
        Assert.Equal(DocumentUploadStatus.Ready, processed.Status);
        Assert.Equal(5, processed.SourceId);
        Assert.NotNull(processed.IngestionRunId);
        Assert.NotNull(processed.ProcessedAt);

        var run = await harness.Db.IngestionRuns.SingleAsync(r => r.Id == processed.IngestionRunId);
        Assert.Equal(5, run.SourceId);
        Assert.Equal(1, run.ArticlesAdded);
        Assert.NotNull(run.CompletedAt);
    }

    [Fact]
    public async Task ProcessUpload_NoCityHint_UsesJhansiInbox()
    {
        await using var harness = CreateHarness();
        await using var pdf = File.OpenRead(FixturePath("hello.pdf"));

        var upload = await harness.Service.EnqueueAsync(
            pdf, "hello.pdf", "application/pdf", cityHintId: null, "editor", CancellationToken.None);
        await harness.Service.ProcessUploadAsync(upload.Id, CancellationToken.None);

        var stored = Assert.Single(await harness.Db.Articles.ToListAsync());
        Assert.Equal(2, stored.CityId);
        Assert.Equal(5, stored.SourceId);
        Assert.Equal(5, (await harness.Db.DocumentUploads.SingleAsync()).SourceId);
    }

    [Fact]
    public async Task ProcessUpload_KanpurHint_LinksKanpurInbox()
    {
        await using var harness = CreateHarness();
        await using var pdf = File.OpenRead(FixturePath("hello.pdf"));

        var upload = await harness.Service.EnqueueAsync(
            pdf, "hello.pdf", "application/pdf", cityHintId: 3, "editor", CancellationToken.None);
        await harness.Service.ProcessUploadAsync(upload.Id, CancellationToken.None);

        var stored = Assert.Single(await harness.Db.Articles.ToListAsync());
        Assert.Equal(3, stored.CityId);
        Assert.Equal(6, stored.SourceId);
    }

    [Fact]
    public async Task ProcessUpload_ThinPdfText_MarksFailed()
    {
        await using var harness = CreateHarness();
        await using var pdf = new MemoryStream(PdfBytes.Create("short"));

        var upload = await harness.Service.EnqueueAsync(
            pdf, "thin.pdf", "application/pdf", cityHintId: 2, "editor", CancellationToken.None);
        await harness.Service.ProcessUploadAsync(upload.Id, CancellationToken.None);

        Assert.Empty(await harness.Db.Articles.ToListAsync());
        var processed = await harness.Db.DocumentUploads.SingleAsync();
        Assert.Equal(DocumentUploadStatus.Failed, processed.Status);
        Assert.Contains("image", processed.ErrorSummary, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("scan", processed.ErrorSummary, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ProcessUpload_TooManyPages_MarksFailed()
    {
        await using var harness = CreateHarness();
        await using var pdf = new MemoryStream(PdfBytes.Create("page text that is long enough for extraction checks", pages: 41));

        var upload = await harness.Service.EnqueueAsync(
            pdf, "long.pdf", "application/pdf", cityHintId: 2, "editor", CancellationToken.None);
        await harness.Service.ProcessUploadAsync(upload.Id, CancellationToken.None);

        Assert.Empty(await harness.Db.Articles.ToListAsync());
        var processed = await harness.Db.DocumentUploads.SingleAsync();
        Assert.Equal(DocumentUploadStatus.Failed, processed.Status);
        Assert.Contains("page", processed.ErrorSummary, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ProcessUpload_JpegImage_UsesVisionAndCreatesArticle()
    {
        await using var harness = CreateHarness();
        await using var image = new MemoryStream([0xFF, 0xD8, 0xFF, 0xD9]);

        var upload = await harness.Service.EnqueueAsync(
            image, "clip.jpg", "image/jpeg", cityHintId: 4, "editor", CancellationToken.None);
        await harness.Service.ProcessUploadAsync(upload.Id, CancellationToken.None);

        var stored = Assert.Single(await harness.Db.Articles.ToListAsync());
        Assert.Equal("From PDF", stored.Headline);
        Assert.Equal(4, stored.CityId);
        Assert.Equal(7, stored.SourceId);
        Assert.Equal(ArticleStatus.PendingReview, stored.Status);
        Assert.Equal(DocumentUploadStatus.Ready, (await harness.Db.DocumentUploads.SingleAsync()).Status);
        Assert.True(harness.Intelligence.ImageExtractCalls >= 1);
    }

    [Fact]
    public async Task Enqueue_OversizeFile_Throws()
    {
        await using var harness = CreateHarness();
        var oversized = new byte[26_214_401];
        oversized[0] = (byte)'%';
        await using var stream = new MemoryStream(oversized);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            harness.Service.EnqueueAsync(stream, "big.pdf", "application/pdf", 2, "editor", CancellationToken.None));

        Assert.Empty(await harness.Db.DocumentUploads.ToListAsync());
    }

    [Fact]
    public async Task ProcessUpload_ZeroStories_MarksFailed()
    {
        await using var harness = CreateHarness(new RecordingFakeIntelligence { Stories = [] });
        await using var pdf = File.OpenRead(FixturePath("hello.pdf"));

        var upload = await harness.Service.EnqueueAsync(
            pdf, "hello.pdf", "application/pdf", cityHintId: 2, "editor", CancellationToken.None);
        await harness.Service.ProcessUploadAsync(upload.Id, CancellationToken.None);

        Assert.Empty(await harness.Db.Articles.ToListAsync());
        Assert.Equal(DocumentUploadStatus.Failed, (await harness.Db.DocumentUploads.SingleAsync()).Status);
    }

    [Fact]
    public async Task Queue_RoundTripsUploadId()
    {
        var queue = new PdfProcessingQueue();
        await queue.EnqueueAsync(42, CancellationToken.None);

        await using var items = queue.ReadAllAsync(CancellationToken.None).GetAsyncEnumerator();
        Assert.True(await items.MoveNextAsync());
        Assert.Equal(42, items.Current);
    }

    private static Harness CreateHarness(RecordingFakeIntelligence? intelligence = null)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"pdf-ingest-{Guid.NewGuid():N}")
            .Options;
        var db = new AppDbContext(options);
        db.Cities.AddRange(SeedData.Cities.Select(c => new City
        {
            Id = c.Id,
            Name = c.Name,
            State = c.State,
            Slug = c.Slug,
        }));
        db.Sources.AddRange(SeedData.Sources.Where(s => s.Type == SourceType.PdfUpload).Select(s => new Source
        {
            Id = s.Id,
            Name = s.Name,
            FeedUrl = s.FeedUrl,
            CityId = s.CityId,
            Type = s.Type,
            Kind = s.Kind,
            Language = s.Language,
            IsActive = s.IsActive,
        }));
        db.SaveChanges();

        var root = Path.Combine(Path.GetTempPath(), "newsfeed-uploads-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);

        var fake = intelligence ?? new RecordingFakeIntelligence();
        var service = new PdfIngestService(
            db,
            new PdfProcessingQueue(),
            fake,
            new IngestionEventBus(),
            Microsoft.Extensions.Options.Options.Create(new UploadOptions { RootPath = root, MaxBytes = 26_214_400, MaxPages = 40 }),
            NullLogger<PdfIngestService>.Instance);

        return new Harness(db, service, fake, root);
    }

    private static string FixturePath(string fileName) =>
        Path.Combine(AppContext.BaseDirectory, "Fixtures", fileName);

    private sealed class Harness(
        AppDbContext db,
        PdfIngestService service,
        RecordingFakeIntelligence intelligence,
        string root) : IAsyncDisposable
    {
        public AppDbContext Db { get; } = db;
        public PdfIngestService Service { get; } = service;
        public RecordingFakeIntelligence Intelligence { get; } = intelligence;

        public async ValueTask DisposeAsync()
        {
            await Db.DisposeAsync();
            if (Directory.Exists(root))
            {
                Directory.Delete(root, recursive: true);
            }
        }
    }
}

public sealed class RecordingFakeIntelligence : IArticleIntelligence
{
    public IReadOnlyList<ExtractedStory> Stories { get; init; } =
    [
        new("From PDF", "Summary line for review.", "Local", null, "en"),
    ];

    public int ImageExtractCalls { get; private set; }

    public Task<IReadOnlyList<ExtractedStory>> ExtractStoriesAsync(
        string plainText, string? cityHintSlug, CancellationToken cancellationToken)
        => Task.FromResult(ApplyHint(cityHintSlug));

    public Task<IReadOnlyList<ExtractedStory>> ExtractStoriesFromImageAsync(
        byte[] imageBytes, string contentType, string? cityHintSlug, CancellationToken cancellationToken)
    {
        ImageExtractCalls++;
        return Task.FromResult(ApplyHint(cityHintSlug));
    }

    public Task<string> SummarizeArticleAsync(
        string headline, string bodyOrSnippet, string citySlug, CancellationToken cancellationToken)
        => Task.FromResult("Short original summary for " + headline);

    private IReadOnlyList<ExtractedStory> ApplyHint(string? cityHintSlug) =>
        Stories.Select(s => s with { CitySlug = cityHintSlug ?? s.CitySlug }).ToList();
}

internal static class PdfBytes
{
    public static byte[] Create(string text, int pages = 1)
    {
        var escaped = text.Replace("\\", "\\\\", StringComparison.Ordinal)
            .Replace("(", "\\(", StringComparison.Ordinal)
            .Replace(")", "\\)", StringComparison.Ordinal);
        var objects = new List<byte[]>();
        objects.Add("1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"u8.ToArray());
        var kids = string.Join(' ', Enumerable.Range(0, pages).Select(i => $"{3 + i} 0 R"));
        objects.Add(System.Text.Encoding.ASCII.GetBytes($"2 0 obj<</Type/Pages/Count {pages}/Kids[{kids}]>>endobj\n"));
        var fontId = 3 + (2 * pages);
        for (var i = 0; i < pages; i++)
        {
            var pageId = 3 + i;
            var contentId = 3 + pages + i;
            objects.Add(System.Text.Encoding.ASCII.GetBytes(
                $"{pageId} 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents {contentId} 0 R/Resources<</Font<</F1 {fontId} 0 R>>>>>>endobj\n"));
        }

        for (var i = 0; i < pages; i++)
        {
            var contentId = 3 + pages + i;
            var stream = System.Text.Encoding.ASCII.GetBytes($"BT /F1 12 Tf 72 720 Td ({escaped}) Tj ET\n");
            objects.Add(System.Text.Encoding.ASCII.GetBytes($"{contentId} 0 obj<</Length {stream.Length}>>stream\n")
                .Concat(stream)
                .Concat("endstream\nendobj\n"u8.ToArray())
                .ToArray());
        }

        objects.Add(System.Text.Encoding.ASCII.GetBytes(
            $"{fontId} 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"));

        var header = "%PDF-1.4\n"u8.ToArray();
        var offsets = new List<int> { 0 };
        var pos = header.Length;
        foreach (var obj in objects)
        {
            offsets.Add(pos);
            pos += obj.Length;
        }

        var xref = new System.Text.StringBuilder();
        xref.Append($"xref\n0 {offsets.Count}\n");
        xref.Append("0000000000 65535 f \n");
        for (var i = 1; i < offsets.Count; i++)
        {
            xref.Append($"{offsets[i]:0000000000} 00000 n \n");
        }

        var trailer = System.Text.Encoding.ASCII.GetBytes(
            $"trailer<</Size {offsets.Count}/Root 1 0 R>>\nstartxref\n{pos}\n%%EOF\n");

        return header
            .Concat(objects.SelectMany(o => o))
            .Concat(System.Text.Encoding.ASCII.GetBytes(xref.ToString()))
            .Concat(trailer)
            .ToArray();
    }
}
