namespace NewsFeed.Api.Dtos;

public sealed record ArticleBodyBackfillResponse(
    int Examined,
    int Updated,
    int Skipped,
    int Failed,
    int? NextAfterId);
