namespace NewsFeed.Api.Options;

/// <summary>
/// Tuning knobs for the anonymous personalized feed ranker
/// (see Services/FeedPersonalizationService). Defaults are code-level so local
/// dev and tests need no config; production overrides via FeedPersonalization__*.
/// </summary>
public sealed class FeedPersonalizationOptions
{
    public const string SectionName = "FeedPersonalization";

    /// <summary>Most recent published articles considered for re-ranking per request.</summary>
    public int CandidatePoolSize { get; set; } = 200;

    /// <summary>Hours after which an article's recency score halves.</summary>
    public double RecencyHalfLifeHours { get; set; } = 18;

    public double RecencyWeight { get; set; } = 1.0;

    /// <summary>Boost for categories the reader's anonymous session opens often.</summary>
    public double AffinityWeight { get; set; } = 0.75;

    /// <summary>Boost for stories trending city-wide over the last 24h.</summary>
    public double TrendingWeight { get; set; } = 0.35;

    /// <summary>Subtractive penalty for stories this session already opened.</summary>
    public double SeenPenalty { get; set; } = 0.9;

    /// <summary>Rolling window of view history used for affinity and seen signals.</summary>
    public int AffinityWindowDays { get; set; } = 14;

    /// <summary>Allowed consecutive stories from one source before diversification swaps.</summary>
    public int MaxSourceStreak { get; set; } = 2;

    /// <summary>How far down the ranked list diversification looks for a different source.</summary>
    public int DiversificationLookahead { get; set; } = 10;
}
