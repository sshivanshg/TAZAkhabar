using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;
using NewsFeed.Api.Dtos;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Ingest;

public sealed class ExtractionWorkerClient(
    IHttpClientFactory httpClientFactory,
    IOptions<ExtractionWorkerOptions> workerOptions,
    IOptions<RssIngestOptions> ingestOptions) : IExtractionWorkerClient
{
    public const string HttpClientName = "extraction-worker";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(workerOptions.Value.BaseUrl);

    public async Task<ExtractionWorkerRunResponse> RunAsync(
        int sourceId,
        int runId,
        CancellationToken cancellationToken)
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException(
                "ExtractionWorker:BaseUrl is not configured. Start the Python ingestion_engine worker.");
        }

        var client = httpClientFactory.CreateClient(HttpClientName);
        using var request = new HttpRequestMessage(HttpMethod.Post, "run")
        {
            Content = JsonContent.Create(new ExtractionWorkerRunRequest(sourceId, runId), options: JsonOptions),
        };
        request.Headers.TryAddWithoutValidation("X-Ingest-Key", ingestOptions.Value.Secret);

        using var response = await client.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"Extraction worker returned {(int)response.StatusCode}: {HtmlText.Truncate(body, 400)}");
        }

        var parsed = JsonSerializer.Deserialize<ExtractionWorkerRunResponse>(body, JsonOptions);
        return parsed ?? new ExtractionWorkerRunResponse(0, 0, 0);
    }
}
