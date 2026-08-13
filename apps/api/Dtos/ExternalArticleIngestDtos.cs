namespace NewsFeed.Api.Dtos;

public sealed record IngestSourcesResponse(IReadOnlyList<IngestSourceDto> Sources);

public sealed record IngestSourceDto(
    int Id,
    string Name,
    string? FeedUrl,
    int CityId,
    string CitySlug,
    string CityName,
    string Language,
    string? ScrapeConfig);

public sealed record IngestArticlesRequest(
    int? RunId,
    IReadOnlyList<IngestArticleItemDto> Articles);

public sealed record IngestArticleItemDto(
    int SourceId,
    string CanonicalUrl,
    string Title,
    DateTimeOffset? PublishedAt,
    string? HeroImageUrl,
    string CleanText,
    string? DetectedLanguage,
    string? ExtractionTier);

public sealed record IngestArticlesResponse(
    int Inserted,
    int Skipped,
    int Failed,
    IReadOnlyList<IngestArticleItemResultDto> Items);

public sealed record IngestArticleItemResultDto(
    string CanonicalUrl,
    string Status,
    string? Error);

public sealed record ExtractionWorkerRunRequest(int SourceId, int RunId);

public sealed record ExtractionWorkerRunResponse(int Inserted, int Skipped, int Failed);
