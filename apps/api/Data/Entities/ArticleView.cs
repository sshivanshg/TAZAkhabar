namespace NewsFeed.Api.Data.Entities;

/// <summary>Anonymous article open event for city trending (no user identity).</summary>
public sealed class ArticleView
{
    public long Id { get; set; }
    public int ArticleId { get; set; }
    public DateTimeOffset ViewedAt { get; set; }
    /// <summary>Opaque client session key for coarse dedup; not a user id.</summary>
    public string? SessionKey { get; set; }

    public Article Article { get; set; } = null!;
}
