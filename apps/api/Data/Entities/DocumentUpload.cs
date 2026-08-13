using NewsFeed.Api.Data;

namespace NewsFeed.Api.Data.Entities;

public sealed class DocumentUpload
{
    public int Id { get; set; }
    public required string OriginalFileName { get; set; }
    public required string StoredPath { get; set; }
    public required string ContentType { get; set; }
    public long ByteSize { get; set; }
    public int? CityHintId { get; set; }
    public DocumentUploadStatus Status { get; set; }
    public string? ErrorSummary { get; set; }
    public int? IngestionRunId { get; set; }
    public int? SourceId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ProcessedAt { get; set; }
    public City? CityHint { get; set; }
    public IngestionRun? IngestionRun { get; set; }
    public Source? Source { get; set; }
    public ICollection<Article> Articles { get; set; } = new List<Article>();
}
