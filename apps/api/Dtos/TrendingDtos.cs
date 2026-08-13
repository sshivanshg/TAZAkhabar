namespace NewsFeed.Api.Dtos;

public sealed record RecordArticleViewRequest(string? SessionId);

public sealed record TrendingArticlesResponse(IReadOnlyList<ArticleResponse> Items);
