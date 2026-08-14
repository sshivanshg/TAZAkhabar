using Microsoft.EntityFrameworkCore;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Dtos;
using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Services;

public interface IArticlePresentationService
{
    Task<ArticleResponse> PresentAsync(
        Article article,
        string? preferredLanguage,
        CancellationToken cancellationToken,
        bool includeBody = false);

    Task<IReadOnlyList<ArticleResponse>> PresentManyAsync(
        IReadOnlyList<Article> articles,
        string? preferredLanguage,
        CancellationToken cancellationToken,
        bool includeBody = false);
}

public sealed class ArticlePresentationService(
    AppDbContext db,
    IArticleIntelligence intelligence,
    ILogger<ArticlePresentationService> logger) : IArticlePresentationService
{
    private const int MaxParallelTranslations = 4;

    public async Task<ArticleResponse> PresentAsync(
        Article article,
        string? preferredLanguage,
        CancellationToken cancellationToken,
        bool includeBody = false)
    {
        var items = await PresentManyAsync([article], preferredLanguage, cancellationToken, includeBody);
        return items[0];
    }

    public async Task<IReadOnlyList<ArticleResponse>> PresentManyAsync(
        IReadOnlyList<Article> articles,
        string? preferredLanguage,
        CancellationToken cancellationToken,
        bool includeBody = false)
    {
        if (articles.Count == 0)
        {
            return [];
        }

        var target = ArticleLanguageDetector.Normalize(preferredLanguage);
        var results = new ArticleResponse[articles.Count];

        if (target is null)
        {
            for (var i = 0; i < articles.Count; i++)
            {
                results[i] = ToOriginal(articles[i], includeBody: includeBody);
            }

            return results;
        }

        var needsWork = new List<(int Index, Article Article)>();
        for (var i = 0; i < articles.Count; i++)
        {
            var article = articles[i];
            var detected = DetectedOf(article);
            if (string.Equals(detected, target, StringComparison.Ordinal))
            {
                results[i] = ToOriginal(article, detected, includeBody);
            }
            else
            {
                needsWork.Add((i, article));
            }
        }

        if (needsWork.Count == 0)
        {
            return results;
        }

        var ids = needsWork.Select(x => x.Article.Id).Distinct().ToList();
        var cached = await db.ArticleTranslations
            .AsNoTracking()
            .Where(t => ids.Contains(t.ArticleId) && t.TargetLanguage == target)
            .ToListAsync(cancellationToken);
        var cacheByArticleId = cached.ToDictionary(t => t.ArticleId);

        var toTranslate = new List<(int Index, Article Article)>();
        foreach (var (index, article) in needsWork)
        {
            if (cacheByArticleId.TryGetValue(article.Id, out var hit)
                && hit.Status == TranslationStatus.Completed
                && !string.IsNullOrWhiteSpace(hit.TranslatedHeadline))
            {
                results[index] = ToTranslated(
                    article,
                    DetectedOf(article),
                    target,
                    hit.TranslatedHeadline,
                    hit.TranslatedSummary,
                    includeBody);
            }
            else
            {
                // Retry Failed on next read so transient provider errors recover.
                toTranslate.Add((index, article));
            }
        }

        if (toTranslate.Count == 0)
        {
            return results;
        }

        // Provider calls in parallel; DB writes sequentially (DbContext is not thread-safe).
        var translationOutcomes = new (int Index, Article Article, string? Headline, string? Summary, bool Ok)[toTranslate.Count];
        await Parallel.ForEachAsync(
            Enumerable.Range(0, toTranslate.Count),
            new ParallelOptions
            {
                MaxDegreeOfParallelism = MaxParallelTranslations,
                CancellationToken = cancellationToken,
            },
            async (i, ct) =>
            {
                var (index, article) = toTranslate[i];
                var detected = DetectedOf(article);
                try
                {
                    var translated = await intelligence.TranslateArticleAsync(
                        article.Headline,
                        article.Summary,
                        detected,
                        target,
                        ct);

                    if (translated is null
                        || string.IsNullOrWhiteSpace(translated.Value.Headline)
                        || string.IsNullOrWhiteSpace(translated.Value.Summary))
                    {
                        translationOutcomes[i] = (index, article, null, null, false);
                        return;
                    }

                    translationOutcomes[i] = (
                        index,
                        article,
                        HtmlText.Truncate(translated.Value.Headline.Trim(), 300),
                        HtmlText.Truncate(translated.Value.Summary.Trim(), 1000),
                        true);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    logger.LogWarning(
                        ex,
                        "Translation failed for article {ArticleId} -> {TargetLanguage}",
                        article.Id,
                        target);
                    translationOutcomes[i] = (index, article, null, null, false);
                }
            });

        foreach (var outcome in translationOutcomes)
        {
            var detected = DetectedOf(outcome.Article);
            if (outcome.Ok && outcome.Headline is not null && outcome.Summary is not null)
            {
                await UpsertTranslationAsync(
                    outcome.Article.Id,
                    target,
                    outcome.Headline,
                    outcome.Summary,
                    TranslationStatus.Completed,
                    cancellationToken);
                results[outcome.Index] = ToTranslated(
                    outcome.Article,
                    detected,
                    target,
                    outcome.Headline,
                    outcome.Summary,
                    includeBody);
            }
            else
            {
                await UpsertTranslationAsync(
                    outcome.Article.Id,
                    target,
                    outcome.Article.Headline,
                    outcome.Article.Summary,
                    TranslationStatus.Failed,
                    cancellationToken);
                results[outcome.Index] = ToOriginal(outcome.Article, detected, includeBody);
            }
        }

        return results;
    }

    private async Task UpsertTranslationAsync(
        int articleId,
        string targetLanguage,
        string headline,
        string summary,
        TranslationStatus status,
        CancellationToken cancellationToken)
    {
        var existing = await db.ArticleTranslations
            .FirstOrDefaultAsync(
                t => t.ArticleId == articleId && t.TargetLanguage == targetLanguage,
                cancellationToken);

        var now = DateTimeOffset.UtcNow;
        if (existing is null)
        {
            db.ArticleTranslations.Add(new ArticleTranslation
            {
                ArticleId = articleId,
                TargetLanguage = targetLanguage,
                TranslatedHeadline = headline,
                TranslatedSummary = summary,
                TranslatedAt = now,
                Status = status,
            });
        }
        else
        {
            existing.TranslatedHeadline = headline;
            existing.TranslatedSummary = summary;
            existing.TranslatedAt = now;
            existing.Status = status;
        }

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            db.ChangeTracker.Clear();
            var winner = await db.ArticleTranslations
                .FirstOrDefaultAsync(
                    t => t.ArticleId == articleId && t.TargetLanguage == targetLanguage,
                    cancellationToken);
            if (winner is null)
            {
                throw;
            }

            winner.TranslatedHeadline = headline;
            winner.TranslatedSummary = summary;
            winner.TranslatedAt = now;
            winner.Status = status;
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    private static string DetectedOf(Article article) =>
        ArticleLanguageDetector.Detect(
            article.Headline,
            article.Summary,
            fallback: article.DetectedLanguage);

    private static ArticleResponse ToOriginal(Article article, string? detected = null, bool includeBody = false)
    {
        var lang = detected ?? DetectedOf(article);
        return new ArticleResponse(
            article.Id,
            article.CityId,
            article.Headline,
            article.Summary,
            includeBody ? article.Body : null,
            article.SourceName,
            article.SourceUrl,
            article.PublishedAt,
            article.Category,
            article.ImageUrl,
            lang,
            lang);
    }

    private static ArticleResponse ToTranslated(
        Article article,
        string detected,
        string display,
        string headline,
        string summary,
        bool includeBody) =>
        new(
            article.Id,
            article.CityId,
            headline,
            summary,
            // Body is stored only in the original language; translated reads use translated summary.
            null,
            article.SourceName,
            article.SourceUrl,
            article.PublishedAt,
            article.Category,
            article.ImageUrl,
            detected,
            display);
}
