using NewsFeed.Api.Dtos;

namespace NewsFeed.Api.Ingest;

internal static class IngestionEvents
{
    public static void Emit(
        IIngestionEventBus bus,
        int runId,
        string type,
        string message,
        int? found = null,
        int? added = null,
        int? skipped = null,
        int? failed = null) =>
        bus.Publish(
            runId,
            new IngestionEventDto(type, message, DateTimeOffset.UtcNow, found, added, skipped, failed));
}
