namespace NewsFeed.Api.Options;

public sealed class ArticleRetentionOptions
{
    public const string SectionName = "ArticleRetention";

    public int Days { get; set; } = 7;
}
