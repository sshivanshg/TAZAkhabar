namespace NewsFeed.Api.Data.Entities;

public sealed class ArticleContent
{
    public int ArticleId { get; set; }
    public required string CleanText { get; set; }
    public string? ExtractionTier { get; set; }

    public Article Article { get; set; } = null!;
}
