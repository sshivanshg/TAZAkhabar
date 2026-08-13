namespace NewsFeed.Api.Ingest;

public sealed record ExtractedStory(
    string Headline,
    string Summary,
    string Category,
    string? CitySlug,
    string Language);
