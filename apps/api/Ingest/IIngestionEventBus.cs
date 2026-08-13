using NewsFeed.Api.Dtos;

namespace NewsFeed.Api.Ingest;

public interface IIngestionEventBus
{
    void Publish(int runId, IngestionEventDto evt);

    IAsyncEnumerable<IngestionEventDto> Subscribe(int runId, CancellationToken cancellationToken);
}
