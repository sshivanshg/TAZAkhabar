namespace NewsFeed.Api.Ingest;

public interface IArticleIntelligence
{
    Task<IReadOnlyList<ExtractedStory>> ExtractStoriesAsync(
        string plainText,
        string? cityHintSlug,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<ExtractedStory>> ExtractStoriesFromImageAsync(
        byte[] imageBytes,
        string contentType,
        string? cityHintSlug,
        CancellationToken cancellationToken);

    Task<string> SummarizeArticleAsync(
        string headline,
        string bodyOrSnippet,
        string citySlug,
        CancellationToken cancellationToken);

    /// <summary>
    /// Translate headline + summary into <paramref name="targetLanguage"/>.
    /// Returns null when the model response cannot be parsed.
    /// </summary>
    Task<(string Headline, string Summary)?> TranslateArticleAsync(
        string headline,
        string summary,
        string sourceLanguage,
        string targetLanguage,
        CancellationToken cancellationToken);
}
