namespace NewsFeed.Api.Ingest;

public interface IScrapeHttpClient
{
    Task<string> GetStringAsync(Uri uri, CancellationToken ct);
}
