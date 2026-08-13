namespace NewsFeed.Api.Ingest;

public sealed class ScrapeHttpClient(IHttpClientFactory httpClientFactory) : IScrapeHttpClient
{
    public const string HttpClientName = "scrape";

    public async Task<string> GetStringAsync(Uri uri, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(uri);
        if (!SafeHttp.TryValidatePublicAbsoluteUri(uri.AbsoluteUri, out var safe, out var error))
        {
            throw new InvalidOperationException(error);
        }

        var client = httpClientFactory.CreateClient(HttpClientName);
        using var response = await client.GetAsync(safe, ct);
        if ((int)response.StatusCode is >= 300 and < 400)
        {
            throw new HttpRequestException(
                $"HTTP {(int)response.StatusCode} redirect from {safe} was not followed.");
        }

        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync(ct);
    }
}
