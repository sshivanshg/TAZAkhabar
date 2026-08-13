namespace NewsFeed.Api.Data.Entities;

public sealed class City
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string State { get; set; }
    public required string Slug { get; set; }

    public ICollection<Article> Articles { get; set; } = new List<Article>();
    public ICollection<Source> Sources { get; set; } = new List<Source>();
}
