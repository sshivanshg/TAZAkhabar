using NewsFeed.Api.Data.Entities;

namespace NewsFeed.Api.Services;

public static class ArticleVisibility
{
    public static IQueryable<Article> ExcludeEpaperEditions(this IQueryable<Article> query) =>
        query.Where(a =>
            !a.SourceUrl.ToLower().Contains("epaper.")
            && !a.SourceUrl.ToLower().Contains("/epaper")
            && !a.SourceUrl.ToLower().Contains("e-paper"));

    public static IQueryable<ArticleView> ExcludeEpaperEditions(this IQueryable<ArticleView> query) =>
        query.Where(v =>
            !v.Article.SourceUrl.ToLower().Contains("epaper.")
            && !v.Article.SourceUrl.ToLower().Contains("/epaper")
            && !v.Article.SourceUrl.ToLower().Contains("e-paper"));
}
