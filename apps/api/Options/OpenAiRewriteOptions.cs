namespace NewsFeed.Api.Options;

public sealed class OpenAiRewriteOptions
{
    public const string SectionName = "OpenAiRewrite";

    /// <summary>
    /// When false, scrape ingest stores extracted headline/summary/body as-is (no OpenAI call).
    /// Missing or empty <see cref="ApiKey"/> also skips rewrite.
    /// </summary>
    public bool Enabled { get; set; } = true;

    public string BaseUrl { get; set; } = "https://api.openai.com/v1";

    public string ApiKey { get; set; } = "";

    public string Model { get; set; } = "gpt-4o-mini";
}
