namespace NewsFeed.Api.Dtos;

public sealed record AdminLoginRequest(string? Password, string? DisplayName);

public sealed record AdminLoginResponse(string Token, DateTimeOffset ExpiresAt);

public sealed record AdminArticleResponse(
    int Id,
    int CityId,
    string Headline,
    string Summary,
    string SourceName,
    string SourceUrl,
    DateTimeOffset PublishedAt,
    string Category,
    string? ImageUrl,
    string Status,
    bool IsMock,
    DateTimeOffset? IngestedAt,
    string? ReviewedBy,
    DateTimeOffset? ReviewedAt,
    int? SourceId);

public sealed record PagedAdminArticlesResponse(
    IReadOnlyList<AdminArticleResponse> Items,
    int Total,
    int Page,
    int Limit);

public sealed record PatchAdminArticleRequest(
    string? Headline,
    string? Summary,
    string? Category,
    string? City);

public sealed record CreateAdminArticleRequest(
    string Headline,
    string Summary,
    string City,
    string Category,
    string SourceName,
    string SourceUrl,
    bool PublishNow);

public sealed record AdminSourceResponse(
    int Id,
    string Name,
    string? FeedUrl,
    int CityId,
    string CitySlug,
    string Type,
    string Kind,
    string Language,
    bool IsActive,
    DateTimeOffset? LastFetchedAt,
    string? LastFetchStatus,
    string? LastErrorMessage);

public sealed record CreateAdminSourceRequest(
    string Name,
    string? FeedUrl,
    string City,
    string Type,
    string Kind,
    string Language,
    bool IsActive);

public sealed record PatchAdminSourceRequest(
    string? Name,
    string? FeedUrl,
    string? City,
    string? Type,
    string? Kind,
    string? Language,
    bool? IsActive);

public sealed record IngestionRunResponseDto(
    int Id,
    int SourceId,
    DateTimeOffset StartedAt,
    DateTimeOffset? CompletedAt,
    int ArticlesFound,
    int ArticlesAdded,
    int ArticlesSkipped,
    int ArticlesFailed,
    string? ErrorSummary);

public sealed record PagedIngestionRunsResponse(
    IReadOnlyList<IngestionRunResponseDto> Items,
    int Total,
    int Page,
    int Limit);
