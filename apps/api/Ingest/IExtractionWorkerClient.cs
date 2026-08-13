using NewsFeed.Api.Dtos;

namespace NewsFeed.Api.Ingest;

public interface IExtractionWorkerClient
{
    bool IsConfigured { get; }

    Task<ExtractionWorkerRunResponse> RunAsync(int sourceId, int runId, CancellationToken cancellationToken);
}
