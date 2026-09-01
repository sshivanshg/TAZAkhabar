using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Options;

namespace NewsFeed.Api.Services;

public sealed class NotificationDispatchService(
    AppDbContext db,
    IHttpClientFactory httpClientFactory,
    IOptions<NotificationsOptions> options,
    ILogger<NotificationDispatchService> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task DispatchArticleAsync(int articleId, CancellationToken cancellationToken)
    {
        var article = await db.Articles
            .AsNoTracking()
            .Include(a => a.City)
            .FirstOrDefaultAsync(a => a.Id == articleId, cancellationToken);
        if (article is null || article.Status != ArticleStatus.Published || article.IsMock)
        {
            return;
        }

        var subscriptions = await db.NotificationSubscriptions
            .Include(s => s.City)
            .Where(s => s.IsEnabled && s.CityId == article.CityId)
            .OrderByDescending(s => s.UpdatedAt)
            .Take(options.Value.SendBatchSize)
            .ToListAsync(cancellationToken);

        if (subscriptions.Count == 0)
        {
            return;
        }

        var eligibleCategories = ParseCategories(article.Category);
        foreach (var subscription in subscriptions)
        {
            if (!Matches(subscription, article, eligibleCategories))
            {
                continue;
            }

            try
            {
                switch (subscription.Platform)
                {
                    case NotificationPlatform.Native:
                        await SendExpoAsync(subscription, article, cancellationToken);
                        break;
                    case NotificationPlatform.Web:
                        await SendWebPushAsync(subscription, article, cancellationToken);
                        break;
                    default:
                        continue;
                }

                subscription.LastDeliveredAt = DateTimeOffset.UtcNow;
                subscription.UpdatedAt = DateTimeOffset.UtcNow;
            }
            catch (Exception ex)
            {
                logger.LogWarning(
                    ex,
                    "Notification dispatch failed for subscription {SubscriptionId} and article {ArticleId}",
                    subscription.Id,
                    articleId);
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static bool Matches(NotificationSubscription subscription, Data.Entities.Article article, HashSet<string> articleCategories)
    {
        if (subscription.DeliveryMode == NotificationDeliveryMode.DailyDigest)
        {
            return false;
        }

        if (!string.IsNullOrWhiteSpace(subscription.PreferredLanguage)
            && !string.Equals(subscription.PreferredLanguage, article.DetectedLanguage, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var configuredCategories = subscription.Categories
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(category => category.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return configuredCategories.Overlaps(articleCategories);
    }

    private static HashSet<string> ParseCategories(string category) =>
        new(StringComparer.OrdinalIgnoreCase)
        {
            category.Trim(),
            "Local",
        };

    private async Task SendExpoAsync(NotificationSubscription subscription, Data.Entities.Article article, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(subscription.ExpoPushToken))
        {
            return;
        }

        var http = httpClientFactory.CreateClient("expo-push");
        var payload = new
        {
            to = subscription.ExpoPushToken,
            title = "TazaKhabar",
            body = article.Headline,
            sound = "default",
            data = new
            {
                articleId = article.Id,
                city = article.City.Slug,
                url = article.SourceUrl,
            },
        };

        var response = await http.PostAsJsonAsync(options.Value.ExpoPushApiUrl, payload, JsonOptions, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Expo push API returned {(int)response.StatusCode} {response.ReasonPhrase}");
        }
    }

    private async Task SendWebPushAsync(NotificationSubscription subscription, Data.Entities.Article article, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(options.Value.WebPushPublicKey)
            || string.IsNullOrWhiteSpace(options.Value.WebPushPrivateKey)
            || string.IsNullOrWhiteSpace(subscription.WebPushEndpoint)
            || string.IsNullOrWhiteSpace(subscription.WebPushP256Dh)
            || string.IsNullOrWhiteSpace(subscription.WebPushAuth))
        {
            logger.LogWarning(
                "Skipping web push for subscription {SubscriptionId}; configuration or subscription details are incomplete.",
                subscription.Id);
            return;
        }

        var client = new WebPush.WebPushClient();
        var pushSubscription = new WebPush.PushSubscription(
            subscription.WebPushEndpoint,
            subscription.WebPushP256Dh,
            subscription.WebPushAuth);
        var vapid = new WebPush.VapidDetails(
            options.Value.WebPushSubject,
            options.Value.WebPushPublicKey,
            options.Value.WebPushPrivateKey);

        var payload = JsonSerializer.Serialize(new
        {
            title = "TazaKhabar",
            body = article.Headline,
            articleId = article.Id,
            city = article.City.Slug,
            url = article.SourceUrl,
        }, JsonOptions);

        await client.SendNotificationAsync(pushSubscription, payload, vapid, cancellationToken);
    }
}
