namespace NewsFeed.Api.Ingest;

public interface IArticleIntelligence
{
    Task<IReadOnlyList<ExtractedStory>> ExtractStoriesAsync(
        string plainText,
        string? cityHintSlug,
        CancellationToken cancellationToken);

    Task<string> SummarizeArticleAsync(
        string headline,
        string bodyOrSnippet,
        string citySlug,
        CancellationToken cancellationToken);
}
