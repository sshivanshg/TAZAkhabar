using NewsFeed.Api.Data;

namespace NewsFeed.Api.Data.Entities;

public sealed class Article
{
    public int Id { get; set; }
    public int CityId { get; set; }
    public required string Headline { get; set; }
    public required string Summary { get; set; }
    public required string SourceName { get; set; }
    public required string SourceUrl { get; set; }
    public DateTimeOffset PublishedAt { get; set; }
    public required string Category { get; set; }
    public string? ImageUrl { get; set; }
    public DateTimeOffset? ImageEnrichmentAttemptedAt { get; set; }
    public ArticleStatus Status { get; set; } = ArticleStatus.Published;
    public bool IsMock { get; set; }
    public DateTimeOffset? IngestedAt { get; set; }
    public string? ReviewedBy { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public int? SourceId { get; set; }
    public int? DocumentUploadId { get; set; }
    /// <summary>ISO 639-1 (or short) code detected at ingest, e.g. hi / en.</summary>
    public required string DetectedLanguage { get; set; }

    public City City { get; set; } = null!;
    public Source? Source { get; set; }
    public DocumentUpload? DocumentUpload { get; set; }
    public ICollection<ArticleTranslation> Translations { get; set; } = new List<ArticleTranslation>();
}
