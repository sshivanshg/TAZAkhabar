namespace NewsFeed.Api.Ingest;

public sealed record ParsedRssItem(
    string Title,
    string Snippet,
    string SourceUrl,
    DateTimeOffset? PublishedAt,
    string? ImageUrl,
    string? SourceName);
