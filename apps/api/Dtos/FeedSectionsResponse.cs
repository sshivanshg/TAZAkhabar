namespace NewsFeed.Api.Dtos;

/// <summary>
/// One ordered feed section. <see cref="Category"/> is the content-analyzed
/// effective category for category sections, null for "top"/"more".
/// </summary>
public sealed record FeedSection(
    string Key,
    string Title,
    string? Category,
    IReadOnlyList<ArticleResponse> Items);

/// <summary>Sectioned partition of the ranked personalized candidate pool.</summary>
public sealed record FeedSectionsResponse(
    IReadOnlyList<FeedSection> Sections,
    int Total);
