namespace NewsFeed.Api.Options;

public sealed class IngestHealthOptions
{
    public const string SectionName = "IngestHealth";

    public int MaxSilenceMinutes { get; set; } = 180;

    public string AlertWebhookUrl { get; set; } = "";
}
