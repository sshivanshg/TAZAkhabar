namespace NewsFeed.Api.Dtos;

public sealed record ArticleSourceUrlBackfillResponse(
    int Examined,
    int Updated,
    int Skipped,
    int Failed,
    int? NextAfterId);
