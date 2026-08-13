namespace NewsFeed.Api.Dtos;

/// <summary>ISO calendar dates (YYYY-MM-DD) in the city's local timezone that have published articles.</summary>
public sealed record ArticleDatesResponse(IReadOnlyList<string> Dates);
