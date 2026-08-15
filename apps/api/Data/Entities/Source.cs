using NewsFeed.Api.Data;

namespace NewsFeed.Api.Data.Entities;

public sealed class Source
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? FeedUrl { get; set; }
    public int CityId { get; set; }
    public SourceType Type { get; set; }
    public SourceKind Kind { get; set; }
    public required string Language { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset? LastFetchedAt { get; set; }
    public FetchStatus? LastFetchStatus { get; set; }
    public string? LastErrorMessage { get; set; }
    public string? ScrapeConfig { get; set; }

    public City City { get; set; } = null!;
    public ICollection<Article> Articles { get; set; } = new List<Article>();
    public ICollection<IngestionRun> IngestionRuns { get; set; } = new List<IngestionRun>();
    public ICollection<IngestionJob> IngestionJobs { get; set; } = new List<IngestionJob>();
}
