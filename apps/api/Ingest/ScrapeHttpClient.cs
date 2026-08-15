namespace NewsFeed.Api.Ingest;

public sealed class ScrapeHttpClient(IHttpClientFactory httpClientFactory) : IScrapeHttpClient
{
    public const string HttpClientName = "scrape";
    private const int MaxAttempts = 3;

    public async Task<string> GetStringAsync(Uri uri, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(uri);
        if (!SafeHttp.TryValidatePublicAbsoluteUri(uri.AbsoluteUri, out var safe, out var error))
        {
            throw new InvalidOperationException(error);
        }

        for (var attempt = 1; attempt <= MaxAttempts; attempt++)
        {
            try
            {
                var client = httpClientFactory.CreateClient(HttpClientName);
                using var response = await client.GetAsync(safe, ct);
                if ((int)response.StatusCode is >= 300 and < 400)
                {
                    throw new HttpRequestException(
                        $"HTTP {(int)response.StatusCode} redirect from {safe} was not followed.",
                        null,
                        response.StatusCode);
                }

                if (!response.IsSuccessStatusCode)
                {
                    if (attempt < MaxAttempts && IsTransient((int)response.StatusCode))
                    {
                        await BackoffAsync(attempt, ct);
                        continue;
                    }

                    response.EnsureSuccessStatusCode();
                }

                return await response.Content.ReadAsStringAsync(ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (HttpRequestException ex) when (attempt < MaxAttempts
                && (ex.StatusCode is null || IsTransient((int)ex.StatusCode.Value)))
            {
                await BackoffAsync(attempt, ct);
            }
        }

        throw new HttpRequestException($"HTTP fetch failed for {safe}.");
    }

    private static bool IsTransient(int statusCode) =>
        statusCode is 408 or 429 || statusCode >= 500;

    private static Task BackoffAsync(int attempt, CancellationToken ct) =>
        Task.Delay(TimeSpan.FromMilliseconds(200 * attempt), ct);
}
