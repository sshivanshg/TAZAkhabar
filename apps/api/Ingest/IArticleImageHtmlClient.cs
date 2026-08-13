namespace NewsFeed.Api.Ingest;

public interface IArticleImageHtmlClient
{
    /// <summary>Returns HTML body, or null on any fetch failure.</summary>
    Task<string?> GetHtmlAsync(Uri uri, CancellationToken ct);
}
