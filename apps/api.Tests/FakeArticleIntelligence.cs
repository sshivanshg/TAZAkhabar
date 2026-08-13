using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class FakeArticleIntelligence : IArticleIntelligence
{
    public int TranslateCallCount { get; private set; }

    public Task<IReadOnlyList<ExtractedStory>> ExtractStoriesAsync(string plainText, string? cityHintSlug, CancellationToken cancellationToken)
        => Task.FromResult<IReadOnlyList<ExtractedStory>>([
            new("From PDF", "Summary line for review.", "Local", cityHintSlug ?? "jhansi", "en")
        ]);

    public Task<IReadOnlyList<ExtractedStory>> ExtractStoriesFromImageAsync(
        byte[] imageBytes, string contentType, string? cityHintSlug, CancellationToken cancellationToken)
        => ExtractStoriesAsync("IMAGE_UPLOAD", cityHintSlug, cancellationToken);

    public Task<string> SummarizeArticleAsync(string headline, string bodyOrSnippet, string citySlug, CancellationToken cancellationToken)
        => Task.FromResult("Short original summary for " + headline);

    public Task<(string Headline, string Summary)?> TranslateArticleAsync(
        string headline,
        string summary,
        string sourceLanguage,
        string targetLanguage,
        CancellationToken cancellationToken)
    {
        TranslateCallCount++;
        var src = ArticleLanguageDetector.Normalize(sourceLanguage) ?? "en";
        var tgt = ArticleLanguageDetector.Normalize(targetLanguage) ?? "en";
        if (string.Equals(src, tgt, StringComparison.Ordinal))
        {
            return Task.FromResult<(string, string)?>(null);
        }

        return Task.FromResult<(string Headline, string Summary)?>((
            $"[{tgt}] {headline}",
            $"[{tgt}] {summary}"));
    }
}
