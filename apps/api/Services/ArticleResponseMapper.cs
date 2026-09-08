using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Dtos;
using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Services;

public interface IArticleResponseMapper
{
    ArticleResponse ToOriginal(Article article, bool includeBody = false);

    ArticleResponse ToTranslated(
        Article article,
        string detectedLanguage,
        string displayLanguage,
        string headline,
        string summary);
}

/// <summary>Pure mapping from article state to the public response contract.</summary>
public sealed class ArticleResponseMapper : IArticleResponseMapper
{
    public ArticleResponse ToOriginal(Article article, bool includeBody = false)
    {
        var language = DetectedOf(article);
        return new ArticleResponse(
            article.Id,
            article.CityId,
            article.Headline,
            article.Summary,
            includeBody ? article.Body : null,
            article.SourceName,
            article.SourceUrl,
            article.PublishedAt,
            EffectiveCategory(article),
            article.ImageUrl,
            language,
            language);
    }

    public ArticleResponse ToTranslated(
        Article article,
        string detectedLanguage,
        string displayLanguage,
        string headline,
        string summary) =>
        new(
            article.Id,
            article.CityId,
            headline,
            summary,
            null,
            article.SourceName,
            article.SourceUrl,
            article.PublishedAt,
            EffectiveCategory(article),
            article.ImageUrl,
            detectedLanguage,
            displayLanguage);

    private static string DetectedOf(Article article) =>
        ArticleLanguageDetector.Detect(
            article.Headline,
            article.Summary,
            fallback: article.DetectedLanguage);

    private static string EffectiveCategory(Article article) =>
        ContentCategoryClassifier.EffectiveCategory(article.Category, article.Headline, article.Summary);
}
