namespace NewsFeed.Api.Ingest;

public sealed record IngestRunResult(int FeedsAttempted, int FeedsFailed, int Inserted, int Skipped);
