namespace NewsFeed.Api.Dtos;

public sealed record ArticleResponse(
    int Id,
    int CityId,
    string Headline,
    string Summary,
    string SourceName,
    string SourceUrl,
    DateTimeOffset PublishedAt,
    string Category,
    string? ImageUrl);
