namespace NewsFeed.Api.Options;

public sealed class RssIngestOptions
{
    public const string SectionName = "RssIngest";

    public string Secret { get; set; } = "";
}
