using Microsoft.EntityFrameworkCore;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;

namespace NewsFeed.Api.Services;

public interface IArticleTranslationStore
{
    Task<IReadOnlyList<ArticleTranslation>> GetAsync(
        IReadOnlyCollection<int> articleIds,
        string targetLanguage,
        CancellationToken cancellationToken);

    Task UpsertAsync(
        int articleId,
        string targetLanguage,
        string headline,
        string summary,
        TranslationStatus status,
        CancellationToken cancellationToken);
}

/// <summary>EF Core adapter for the article translation cache.</summary>
public sealed class ArticleTranslationStore(AppDbContext db) : IArticleTranslationStore
{
    public async Task<IReadOnlyList<ArticleTranslation>> GetAsync(
        IReadOnlyCollection<int> articleIds,
        string targetLanguage,
        CancellationToken cancellationToken) =>
        await db.ArticleTranslations
            .AsNoTracking()
            .Where(t => articleIds.Contains(t.ArticleId) && t.TargetLanguage == targetLanguage)
            .ToListAsync(cancellationToken);

    public async Task UpsertAsync(
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
}
