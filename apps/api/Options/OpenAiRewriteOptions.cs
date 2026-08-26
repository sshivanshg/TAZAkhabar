namespace NewsFeed.Api.Options;

public sealed class OpenAiRewriteOptions
{
    public const string SectionName = "OpenAiRewrite";

    public string BaseUrl { get; set; } = "https://api.openai.com/v1";

    public string ApiKey { get; set; } = "";

    public string Model { get; set; } = "gpt-4o-mini";
}
