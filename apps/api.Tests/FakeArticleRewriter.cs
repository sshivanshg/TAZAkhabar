using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class FakeArticleRewriter : IArticleRewriter
{
    public int RewriteCallCount { get; private set; }

    public Func<string, string, string, RewrittenArticle?>? Handler { get; set; }

    public Exception? ThrowOnRewrite { get; set; }

    public Task<RewrittenArticle?> RewriteScrapedArticleAsync(
        string headline,
        string bodyOrSnippet,
        string citySlug,
        CancellationToken cancellationToken)
    {
        RewriteCallCount++;
        if (ThrowOnRewrite is not null)
        {
            throw ThrowOnRewrite;
        }

        if (Handler is not null)
        {
            return Task.FromResult(Handler(headline, bodyOrSnippet, citySlug));
        }

        return Task.FromResult<RewrittenArticle?>(new RewrittenArticle(
            $"Rewritten: {headline}",
            $"Original digest summary for {headline}.",
            $"Original digest body for {headline}.\n\nSecond paragraph."));
    }
}
