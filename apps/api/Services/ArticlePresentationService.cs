using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Data;
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
    IArticleIntelligence intelligence,
    IArticleResponseMapper responseMapper,
    IArticleTranslationStore translationStore,
    ILogger<ArticlePresentationService> logger) : IArticlePresentationService
{
    private const int MaxParallelTranslations = 4;
    private const int MaxTranslationCallsPerRequest = 5;

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
                results[i] = responseMapper.ToOriginal(articles[i], includeBody);
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
                results[i] = responseMapper.ToOriginal(article, includeBody);
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
        var cached = await translationStore.GetAsync(ids, target, cancellationToken);
        var cacheByArticleId = cached.ToDictionary(t => t.ArticleId);

        var toTranslate = new List<(int Index, Article Article)>();
        foreach (var (index, article) in needsWork)
        {
            if (cacheByArticleId.TryGetValue(article.Id, out var hit)
                && hit.Status == TranslationStatus.Completed
                && !string.IsNullOrWhiteSpace(hit.TranslatedHeadline))
            {
                results[index] = responseMapper.ToTranslated(
                    article,
                    DetectedOf(article),
                    target,
                    hit.TranslatedHeadline,
                    hit.TranslatedSummary);
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

        var cappedToTranslate = toTranslate.Take(MaxTranslationCallsPerRequest).ToList();
        foreach (var deferred in toTranslate.Skip(MaxTranslationCallsPerRequest))
        {
            results[deferred.Index] = responseMapper.ToOriginal(deferred.Article, includeBody);
        }

        // Provider calls in parallel; DB writes sequentially (DbContext is not thread-safe).
        var translationOutcomes = new (int Index, Article Article, string? Headline, string? Summary, bool Ok)[cappedToTranslate.Count];
        await Parallel.ForEachAsync(
            Enumerable.Range(0, cappedToTranslate.Count),
            new ParallelOptions
            {
                MaxDegreeOfParallelism = MaxParallelTranslations,
                CancellationToken = cancellationToken,
            },
            async (i, ct) =>
            {
                var (index, article) = cappedToTranslate[i];
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
                await translationStore.UpsertAsync(
                    outcome.Article.Id,
                    target,
                    outcome.Headline,
                    outcome.Summary,
                    TranslationStatus.Completed,
                    cancellationToken);
                results[outcome.Index] = responseMapper.ToTranslated(
                    outcome.Article,
                    detected,
                    target,
                    outcome.Headline,
                    outcome.Summary);
            }
            else
            {
                await translationStore.UpsertAsync(
                    outcome.Article.Id,
                    target,
                    outcome.Article.Headline,
                    outcome.Article.Summary,
                    TranslationStatus.Failed,
                    cancellationToken);
                results[outcome.Index] = responseMapper.ToOriginal(outcome.Article, includeBody);
            }
        }

        return results;
    }

    private static string DetectedOf(Article article) =>
        ArticleLanguageDetector.Detect(
            article.Headline,
            article.Summary,
            fallback: article.DetectedLanguage);
}
