using Microsoft.EntityFrameworkCore;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Dtos;

namespace NewsFeed.Api.Endpoints;

public static class NotificationsEndpoints
{
    private static readonly string[] AllowedCategories = ["Local", "State", "National", "Business", "Health", "Sports"];
    private static readonly string[] AllowedPlatforms = ["native", "web"];
    private static readonly string[] AllowedDeliveryModes = ["breaking", "daily-digest"];

    public static RouteGroupBuilder MapNotificationsEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/notifications/status", async (
                string? clientId,
                string? platform,
                string? city,
                AppDbContext db,
                CancellationToken cancellationToken) =>
            {
                if (string.IsNullOrWhiteSpace(city))
                {
                    return Results.Problem(
                        title: "Invalid city",
                        detail: "Query parameter 'city' (slug) is required.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var slug = city.Trim().ToLowerInvariant();
                var cityEntity = await db.Cities.AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Slug == slug, cancellationToken);
                if (cityEntity is null)
                {
                    return Results.Problem(
                        title: "Unknown city",
                        detail: $"No city found with slug '{slug}'.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(platform))
                {
                    return Results.Ok(new NotificationPermissionStatusResponse(
                        Supported: true,
                        Enabled: false,
                        CanPrompt: true,
                        PermissionState: "unknown",
                        LastPromptAt: null,
                        ClientId: null,
                        Subscription: null));
                }

                var normalizedPlatform = NormalizePlatform(platform);
                if (normalizedPlatform is null)
                {
                    return Results.Problem(
                        title: "Invalid platform",
                        detail: $"platform must be one of: {string.Join(", ", AllowedPlatforms)}.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var subscription = await db.NotificationSubscriptions.AsNoTracking()
                    .Include(s => s.City)
                    .FirstOrDefaultAsync(
                        s => s.ClientId == clientId.Trim() && s.Platform == normalizedPlatform.Value,
                        cancellationToken);

                if (subscription is null)
                {
                    return Results.Ok(new NotificationPermissionStatusResponse(
                        Supported: true,
                        Enabled: false,
                        CanPrompt: true,
                        PermissionState: "unknown",
                        LastPromptAt: null,
                        ClientId: clientId.Trim(),
                        Subscription: null));
                }

                var response = ToResponse(subscription);
                return Results.Ok(new NotificationPermissionStatusResponse(
                    Supported: true,
                    Enabled: subscription.IsEnabled,
                    CanPrompt: !subscription.PermissionDeniedAt.HasValue,
                    PermissionState: subscription.IsEnabled ? "granted" : "disabled",
                    LastPromptAt: subscription.LastPromptAt,
                    ClientId: subscription.ClientId,
                    Subscription: response));
            })
            .WithName("GetNotificationStatus")
            .WithOpenApi()
            .Produces<NotificationPermissionStatusResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        api.MapPost("/notifications/subscriptions", async (
                UpsertNotificationSubscriptionRequest request,
                AppDbContext db,
                CancellationToken cancellationToken) =>
            {
                var validation = Validate(request);
                if (validation is not null)
                {
                    return validation;
                }

                var clientId = request.ClientId.Trim();
                var slug = request.City.Trim().ToLowerInvariant();
                var city = await db.Cities.FirstOrDefaultAsync(c => c.Slug == slug, cancellationToken);
                if (city is null)
                {
                    return Results.Problem(
                        title: "Unknown city",
                        detail: $"No city found with slug '{slug}'.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var platform = NormalizePlatform(request.Platform);
                if (platform is null)
                {
                    return Results.Problem(
                        title: "Invalid platform",
                        detail: $"platform must be one of: {string.Join(", ", AllowedPlatforms)}.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var mode = NormalizeDeliveryMode(request.DeliveryMode);
                if (mode is null)
                {
                    return Results.Problem(
                        title: "Invalid delivery mode",
                        detail: $"deliveryMode must be one of: {string.Join(", ", AllowedDeliveryModes)}.",
                        statusCode: StatusCodes.Status400BadRequest);
                }
                var categories = NormalizeCategories(request.Categories);
                var now = DateTimeOffset.UtcNow;

                var subscription = await db.NotificationSubscriptions
                    .Include(s => s.City)
                    .FirstOrDefaultAsync(s => s.ClientId == clientId && s.Platform == platform, cancellationToken);

                if (subscription is null)
                {
                    subscription = new NotificationSubscription
                    {
                        ClientId = clientId,
                        Platform = platform.Value,
                        CityId = city.Id,
                        DeliveryMode = mode.Value,
                        Categories = categories,
                        PreferredLanguage = NormalizeLanguage(request.PreferredLanguage),
                        ExpoPushToken = NormalizeText(request.ExpoPushToken, 512),
                        WebPushEndpoint = NormalizeText(request.WebPushSubscription?.Endpoint, 1000),
                        WebPushP256Dh = NormalizeText(request.WebPushSubscription?.P256Dh, 512),
                        WebPushAuth = NormalizeText(request.WebPushSubscription?.Auth, 256),
                        IsEnabled = request.Enabled,
                        PermissionGrantedAt = request.Enabled ? now : null,
                        PermissionDeniedAt = request.Enabled ? null : now,
                        LastPromptAt = now,
                        CreatedAt = now,
                        UpdatedAt = now,
                        City = city,
                    };
                    db.NotificationSubscriptions.Add(subscription);
                }
                else
                {
                    subscription.CityId = city.Id;
                    subscription.DeliveryMode = mode.Value;
                    subscription.Categories = categories;
                    subscription.PreferredLanguage = NormalizeLanguage(request.PreferredLanguage);
                    subscription.ExpoPushToken = NormalizeText(request.ExpoPushToken, 512);
                    subscription.WebPushEndpoint = NormalizeText(request.WebPushSubscription?.Endpoint, 1000);
                    subscription.WebPushP256Dh = NormalizeText(request.WebPushSubscription?.P256Dh, 512);
                    subscription.WebPushAuth = NormalizeText(request.WebPushSubscription?.Auth, 256);
                    subscription.IsEnabled = request.Enabled;
                    subscription.PermissionGrantedAt = request.Enabled ? subscription.PermissionGrantedAt ?? now : subscription.PermissionGrantedAt;
                    subscription.PermissionDeniedAt = request.Enabled ? null : now;
                    subscription.LastPromptAt = now;
                    subscription.UpdatedAt = now;
                    subscription.City = city;
                }

                await db.SaveChangesAsync(cancellationToken);
                return Results.Ok(ToResponse(subscription));
            })
            .WithName("UpsertNotificationSubscription")
            .WithOpenApi()
            .Produces<NotificationSubscriptionResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        api.MapDelete("/notifications/subscriptions/{clientId}", async (
                string clientId,
                string? platform,
                AppDbContext db,
                CancellationToken cancellationToken) =>
            {
                if (string.IsNullOrWhiteSpace(clientId))
                {
                    return Results.Problem(
                        title: "Invalid clientId",
                        detail: "Path parameter 'clientId' is required.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var normalizedPlatform = string.IsNullOrWhiteSpace(platform)
                    ? NotificationPlatform.Native
                    : NormalizePlatform(platform);
                if (normalizedPlatform is null)
                {
                    return Results.Problem(
                        title: "Invalid platform",
                        detail: $"platform must be one of: {string.Join(", ", AllowedPlatforms)}.",
                        statusCode: StatusCodes.Status400BadRequest);
                }

                var subscription = await db.NotificationSubscriptions
                    .FirstOrDefaultAsync(
                        s => s.ClientId == clientId.Trim() && s.Platform == normalizedPlatform.Value,
                        cancellationToken);
                if (subscription is null)
                {
                    return Results.NoContent();
                }

                subscription.IsEnabled = false;
                subscription.PermissionDeniedAt = DateTimeOffset.UtcNow;
                subscription.UpdatedAt = DateTimeOffset.UtcNow;
                await db.SaveChangesAsync(cancellationToken);
                return Results.NoContent();
            })
            .WithName("DeleteNotificationSubscription")
            .WithOpenApi()
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        return api;
    }

    private static IResult? Validate(UpsertNotificationSubscriptionRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        Require(errors, nameof(request.ClientId), request.ClientId);
        Require(errors, nameof(request.Platform), request.Platform);
        Require(errors, nameof(request.City), request.City);
        Require(errors, nameof(request.DeliveryMode), request.DeliveryMode);

        if (!string.IsNullOrWhiteSpace(request.ClientId) && request.ClientId.Trim().Length > 80)
        {
            Add(errors, nameof(request.ClientId), "clientId must be at most 80 characters.");
        }

        if (!string.IsNullOrWhiteSpace(request.Platform) && NormalizePlatform(request.Platform) is null)
        {
            Add(errors, nameof(request.Platform), $"platform must be one of: {string.Join(", ", AllowedPlatforms)}.");
        }

        if (!string.IsNullOrWhiteSpace(request.DeliveryMode) && NormalizeDeliveryMode(request.DeliveryMode) is null)
        {
            Add(errors, nameof(request.DeliveryMode), $"deliveryMode must be one of: {string.Join(", ", AllowedDeliveryModes)}.");
        }

        if (request.Categories is { Length: > 0 })
        {
            var invalidCategories = request.Categories
                .Select(category => category.Trim())
                .Where(category => !AllowedCategories.Contains(category, StringComparer.OrdinalIgnoreCase))
                .ToArray();
            if (invalidCategories.Length > 0)
            {
                Add(errors, nameof(request.Categories), $"categories may only include: {string.Join(", ", AllowedCategories)}.");
            }
        }

        if (string.Equals(request.Platform?.Trim(), "native", StringComparison.OrdinalIgnoreCase)
            && string.IsNullOrWhiteSpace(request.ExpoPushToken))
        {
            Add(errors, nameof(request.ExpoPushToken), "expoPushToken is required for native subscriptions.");
        }

        if (string.Equals(request.Platform?.Trim(), "web", StringComparison.OrdinalIgnoreCase)
            && request.WebPushSubscription is null)
        {
            Add(errors, nameof(request.WebPushSubscription), "webPushSubscription is required for web subscriptions.");
        }

        return errors.Count == 0 ? null : Results.ValidationProblem(errors);
    }

    private static NotificationSubscriptionResponse ToResponse(NotificationSubscription subscription) =>
        new(
            subscription.ClientId,
            subscription.Platform.ToString().ToLowerInvariant(),
            subscription.City.Slug,
            subscription.DeliveryMode.ToString().ToLowerInvariant().Replace("dailydigest", "daily-digest"),
            subscription.Categories.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
            subscription.PreferredLanguage,
            subscription.IsEnabled,
            subscription.PermissionGrantedAt,
            subscription.PermissionDeniedAt,
            subscription.LastPromptAt,
            subscription.LastDeliveredAt,
            subscription.UpdatedAt);

    private static NotificationPlatform? NormalizePlatform(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim().ToLowerInvariant() switch
        {
            "native" => NotificationPlatform.Native,
            "web" => NotificationPlatform.Web,
            _ => null,
        };
    }

    private static NotificationDeliveryMode? NormalizeDeliveryMode(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim().ToLowerInvariant() switch
        {
            "breaking" => NotificationDeliveryMode.Breaking,
            "daily-digest" => NotificationDeliveryMode.DailyDigest,
            "daily_digest" => NotificationDeliveryMode.DailyDigest,
            _ => null,
        };
    }

    private static string NormalizeCategories(string[]? categories)
    {
        var values = (categories ?? ["Local", "State", "National"])
            .Select(category => category.Trim())
            .Where(category => !string.IsNullOrWhiteSpace(category))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Where(category => AllowedCategories.Contains(category, StringComparer.OrdinalIgnoreCase))
            .ToArray();

        return values.Length == 0 ? "Local" : string.Join(',', values);
    }

    private static string? NormalizeLanguage(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var trimmed = value.Trim().ToLowerInvariant();
        return trimmed.Length is > 0 and <= 8 ? trimmed : null;
    }

    private static string? NormalizeText(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var trimmed = value.Trim();
        return trimmed.Length > maxLength ? trimmed[..maxLength] : trimmed;
    }

    private static void Require(Dictionary<string, string[]> errors, string field, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            Add(errors, field, $"{char.ToLowerInvariant(field[0])}{field[1..]} is required.");
        }
    }

    private static void Add(Dictionary<string, string[]> errors, string field, string message)
    {
        if (errors.TryGetValue(field, out var existing))
        {
            errors[field] = [.. existing, message];
        }
        else
        {
            errors[field] = [message];
        }
    }
}
