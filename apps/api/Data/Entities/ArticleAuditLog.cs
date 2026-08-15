namespace NewsFeed.Api.Data.Entities;

public sealed class ArticleAuditLog
{
    public int Id { get; set; }
    public int ArticleId { get; set; }
    public required string Action { get; set; }
    public required string Actor { get; set; }
    public DateTimeOffset OccurredAt { get; set; }

    public Article Article { get; set; } = null!;
}
