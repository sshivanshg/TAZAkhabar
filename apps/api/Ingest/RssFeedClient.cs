namespace NewsFeed.Api.Ingest;

public sealed class RssFeedClient(IHttpClientFactory httpClientFactory) : IRssFeedClient
{
    private const int MaxAttempts = 3;

    public async Task<string?> FetchXmlAsync(string url, CancellationToken cancellationToken)
    {
        for (var attempt = 1; attempt <= MaxAttempts; attempt++)
        {
            try
            {
                var client = httpClientFactory.CreateClient("rss");
                using var response = await client.GetAsync(url, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    if (attempt < MaxAttempts && IsTransient((int)response.StatusCode))
                    {
                        await BackoffAsync(attempt, cancellationToken);
                        continue;
                    }

                    return null;
                }

                return await response.Content.ReadAsStringAsync(cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
            {
                if (attempt < MaxAttempts)
                {
                    await BackoffAsync(attempt, cancellationToken);
                    continue;
                }

                return null;
            }
        }

        return null;
    }

    private static bool IsTransient(int statusCode) =>
        statusCode is 408 or 429 || statusCode >= 500;

    private static Task BackoffAsync(int attempt, CancellationToken ct) =>
        Task.Delay(TimeSpan.FromMilliseconds(200 * attempt), ct);
}
