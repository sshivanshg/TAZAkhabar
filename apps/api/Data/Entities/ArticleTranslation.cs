namespace NewsFeed.Api.Data.Entities;

public sealed class ArticleTranslation
{
    public int Id { get; set; }
    public int ArticleId { get; set; }
    public required string TargetLanguage { get; set; }
    public required string TranslatedHeadline { get; set; }
    public required string TranslatedSummary { get; set; }
    public DateTimeOffset TranslatedAt { get; set; }
    public TranslationStatus Status { get; set; }

    public Article Article { get; set; } = null!;
}
