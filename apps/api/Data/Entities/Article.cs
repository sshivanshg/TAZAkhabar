namespace NewsFeed.Api.Data.Entities;

public sealed class Article
{
    public int Id { get; set; }
    public int CityId { get; set; }
    public required string Headline { get; set; }
    public required string Summary { get; set; }
    public required string SourceName { get; set; }
    public required string SourceUrl { get; set; }
    public DateTimeOffset PublishedAt { get; set; }
    public required string Category { get; set; }
    public string? ImageUrl { get; set; }

    public City City { get; set; } = null!;
}
