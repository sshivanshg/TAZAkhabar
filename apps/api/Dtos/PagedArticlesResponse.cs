namespace NewsFeed.Api.Dtos;

public sealed record PagedArticlesResponse(
    IReadOnlyList<ArticleResponse> Items,
    int Total,
    int Offset,
    int Limit);
