using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;

namespace NewsFeed.Api.Services;

public static class ArticleRetention
{
    public static DateTimeOffset CutoffUtc(DateTimeOffset utcNow, int days)
    {
        var d = days < 1 ? 7 : days;
        return utcNow.AddDays(-d);
    }

    public static DateTimeOffset AgeTimestamp(Article a) =>
        a.Status == ArticleStatus.Published
            ? a.PublishedAt
            : (a.IngestedAt ?? a.PublishedAt);
}
