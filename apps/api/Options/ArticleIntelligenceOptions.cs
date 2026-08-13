namespace NewsFeed.Api.Options;

public sealed class ArticleIntelligenceOptions
{
    public const string SectionName = "ArticleIntelligence";

    public string BaseUrl { get; set; } = "https://api.anthropic.com";

    public string ApiKey { get; set; } = "";

    public string Model { get; set; } = "claude-sonnet-4-5";
}
