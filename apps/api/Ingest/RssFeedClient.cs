namespace NewsFeed.Api.Ingest;

public sealed class RssFeedClient(IHttpClientFactory httpClientFactory) : IRssFeedClient
{
    public async Task<string?> FetchXmlAsync(string url, CancellationToken cancellationToken)
    {
        try
        {
            var client = httpClientFactory.CreateClient("rss");
            using var response = await client.GetAsync(url, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            return await response.Content.ReadAsStringAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (HttpRequestException)
        {
            return null;
        }
        catch (TaskCanceledException)
        {
            return null;
        }
    }
}
