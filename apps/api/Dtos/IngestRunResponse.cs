namespace NewsFeed.Api.Dtos;

public sealed record IngestRunResponse(int FeedsAttempted, int FeedsFailed, int Inserted, int Skipped);
