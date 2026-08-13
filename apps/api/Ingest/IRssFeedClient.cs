namespace NewsFeed.Api.Ingest;

public interface IRssFeedClient
{
    Task<string?> FetchXmlAsync(string url, CancellationToken cancellationToken);
}
