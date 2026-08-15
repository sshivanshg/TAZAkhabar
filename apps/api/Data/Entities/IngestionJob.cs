using NewsFeed.Api.Data;

namespace NewsFeed.Api.Data.Entities;

public sealed class IngestionJob
{
    public int Id { get; set; }
    public int SourceId { get; set; }
    public int IngestionRunId { get; set; }
    public IngestionJobStatus Status { get; set; } = IngestionJobStatus.Queued;
    public int Attempts { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public string? ErrorSummary { get; set; }

    public Source Source { get; set; } = null!;
    public IngestionRun IngestionRun { get; set; } = null!;
}
