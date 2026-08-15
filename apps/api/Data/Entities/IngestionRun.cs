namespace NewsFeed.Api.Data.Entities;

public sealed class IngestionRun
{
    public int Id { get; set; }
    public int SourceId { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public int ArticlesFound { get; set; }
    public int ArticlesAdded { get; set; }
    public int ArticlesSkipped { get; set; }
    public int ArticlesFailed { get; set; }
    public string? ErrorSummary { get; set; }

    public Source Source { get; set; } = null!;
    public IngestionJob? IngestionJob { get; set; }
}
