using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Options;

public sealed class RssFeedConfig
{
    public string SourceName { get; set; } = "";

    public string Url { get; set; } = "";

    public string Language { get; set; } = "";

    public RssFeedKind Kind { get; set; }

    public string CitySlug { get; set; } = "";
}

public sealed class RssIngestOptions
{
    public const string SectionName = "RssIngest";

    public string Secret { get; set; } = "";

    public List<RssFeedConfig> Feeds { get; set; } = [];
}
