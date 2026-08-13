namespace NewsFeed.Api.Options;

public sealed class AdminOptions
{
    public const string SectionName = "Admin";

    public string Password { get; set; } = "";

    public string JwtSigningKey { get; set; } = "";
}
