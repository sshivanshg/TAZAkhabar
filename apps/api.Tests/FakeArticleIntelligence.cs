using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class FakeArticleIntelligence : IArticleIntelligence
{
    public Task<IReadOnlyList<ExtractedStory>> ExtractStoriesAsync(string plainText, string? cityHintSlug, CancellationToken cancellationToken)
        => Task.FromResult<IReadOnlyList<ExtractedStory>>([
            new("From PDF", "Summary line for review.", "Local", cityHintSlug ?? "jhansi", "en")
        ]);

    public Task<string> SummarizeArticleAsync(string headline, string bodyOrSnippet, string citySlug, CancellationToken cancellationToken)
        => Task.FromResult("Short original summary for " + headline);
}
