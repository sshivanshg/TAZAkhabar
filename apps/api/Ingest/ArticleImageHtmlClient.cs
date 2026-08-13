namespace NewsFeed.Api.Ingest;

public sealed class ArticleImageHtmlClient(IHttpClientFactory httpClientFactory) : IArticleImageHtmlClient
{
    public const string HttpClientName = "image-enrichment";
    public const int MaxHtmlBytes = 2 * 1024 * 1024;

    public async Task<string?> GetHtmlAsync(Uri uri, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(uri);
        if (!SafeHttp.TryValidatePublicAbsoluteUri(uri.AbsoluteUri, out var safe, out _))
        {
            return null;
        }

        try
        {
            var client = httpClientFactory.CreateClient(HttpClientName);
            using var response = await client.GetAsync(safe, HttpCompletionOption.ResponseHeadersRead, ct);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            if (response.Content.Headers.ContentLength is long length && length > MaxHtmlBytes)
            {
                return null;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            using var limited = new MemoryStream(capacity: Math.Min(MaxHtmlBytes, 64 * 1024));
            var buffer = new byte[8192];
            var total = 0;
            while (true)
            {
                var read = await stream.ReadAsync(buffer.AsMemory(0, buffer.Length), ct);
                if (read == 0)
                {
                    break;
                }

                total += read;
                if (total > MaxHtmlBytes)
                {
                    return null;
                }

                await limited.WriteAsync(buffer.AsMemory(0, read), ct);
            }

            limited.Position = 0;
            using var reader = new StreamReader(limited);
            return await reader.ReadToEndAsync(ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            return null;
        }
    }
}
