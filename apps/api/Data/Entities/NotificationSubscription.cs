namespace NewsFeed.Api.Data.Entities;

public sealed class NotificationSubscription
{
    public int Id { get; set; }
    public required string ClientId { get; set; }
    public required NotificationPlatform Platform { get; set; }
    public int CityId { get; set; }
    public required NotificationDeliveryMode DeliveryMode { get; set; }
    public required string Categories { get; set; }
    public string? PreferredLanguage { get; set; }
    public string? ExpoPushToken { get; set; }
    public string? WebPushEndpoint { get; set; }
    public string? WebPushP256Dh { get; set; }
    public string? WebPushAuth { get; set; }
    public bool IsEnabled { get; set; } = true;
    public DateTimeOffset? PermissionGrantedAt { get; set; }
    public DateTimeOffset? PermissionDeniedAt { get; set; }
    public DateTimeOffset? LastPromptAt { get; set; }
    public DateTimeOffset? LastDeliveredAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public City City { get; set; } = null!;
}
