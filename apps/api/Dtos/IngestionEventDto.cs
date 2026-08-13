namespace NewsFeed.Api.Dtos;

public sealed record IngestionEventDto(
    string Type,
    string Message,
    DateTimeOffset At,
    int? Found = null,
    int? Added = null,
    int? Skipped = null,
    int? Failed = null);
