namespace Buildy.Api.Dtos;

public sealed record HealthResponse(
    string Status,
    string Service,
    DateTimeOffset TimestampUtc,
    string Database);
