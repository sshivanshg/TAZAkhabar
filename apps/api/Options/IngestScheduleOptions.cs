namespace NewsFeed.Api.Options;

/// <summary>
/// In-process ingest scheduler. Enabled in production when external crons are unavailable
/// or as a complement to Render/GitHub Actions triggers.
/// </summary>
public sealed class IngestScheduleOptions
{
    public const string SectionName = "IngestSchedule";

    /// <summary>When true and <see cref="RssIngestOptions.Secret"/> is set, the API runs RSS/scrape on a timer.</summary>
    public bool Enabled { get; set; }

    /// <summary>Minutes between RSS batch runs (default 15 — rotates through all feeds within ~45 min).</summary>
    public int RssIntervalMinutes { get; set; } = 15;

    /// <summary>Max RSS sources per batch (default 30). Oldest/never-fetched sources run first.</summary>
    public int RssMaxSourcesPerRun { get; set; } = 30;

    /// <summary>Minutes between scrape runs (default 45).</summary>
    public int ScrapeIntervalMinutes { get; set; } = 45;

    /// <summary>When true, scheduled scrape uses OpenAI rewrite only if the API key is configured.</summary>
    public bool ScrapeUseRewriteWhenConfigured { get; set; } = true;
}
