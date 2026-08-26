namespace NewsFeed.Api.Ingest;

public sealed record RewrittenArticle(string Headline, string Summary, string Body);

public interface IArticleRewriter
{
    /// <summary>
    /// Rewrite scraped headline/body into original digest copy.
    /// Returns null when the API key is missing, the model fails, or the response cannot be parsed.
    /// </summary>
    Task<RewrittenArticle?> RewriteScrapedArticleAsync(
        string headline,
        string bodyOrSnippet,
        string citySlug,
        CancellationToken cancellationToken);
}
