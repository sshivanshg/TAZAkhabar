namespace NewsFeed.Api.Dtos;

public sealed record WebPushSubscriptionDto(
    string Endpoint,
    string P256Dh,
    string Auth,
    long? ExpirationTime);

public sealed record UpsertNotificationSubscriptionRequest(
    string ClientId,
    string Platform,
    string City,
    string DeliveryMode,
    string[]? Categories,
    string? PreferredLanguage,
    string? ExpoPushToken,
    WebPushSubscriptionDto? WebPushSubscription,
    bool Enabled = true);

public sealed record NotificationSubscriptionResponse(
    string ClientId,
    string Platform,
    string City,
    string DeliveryMode,
    IReadOnlyList<string> Categories,
    string? PreferredLanguage,
    bool Enabled,
    DateTimeOffset? PermissionGrantedAt,
    DateTimeOffset? PermissionDeniedAt,
    DateTimeOffset? LastPromptAt,
    DateTimeOffset? LastDeliveredAt,
    DateTimeOffset UpdatedAt);

public sealed record NotificationPermissionStatusResponse(
    bool Supported,
    bool Enabled,
    bool CanPrompt,
    string PermissionState,
    DateTimeOffset? LastPromptAt,
    string? ClientId,
    NotificationSubscriptionResponse? Subscription);
