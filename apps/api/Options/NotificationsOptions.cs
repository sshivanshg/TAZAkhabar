namespace NewsFeed.Api.Options;

public sealed class NotificationsOptions
{
    public const string SectionName = "Notifications";

    public string ExpoAccessToken { get; set; } = string.Empty;
    public string ExpoPushApiUrl { get; set; } = "https://exp.host/--/api/v2/push/send";
    public string WebPushSubject { get; set; } = "mailto:support@tazakhabar.com";
    public string WebPushPublicKey { get; set; } = string.Empty;
    public string WebPushPrivateKey { get; set; } = string.Empty;
    public int PromptCooldownDays { get; set; } = 7;
    public int SendBatchSize { get; set; } = 100;
}
