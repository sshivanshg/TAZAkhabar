using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Options;
using NewsFeed.Api.Services;

namespace NewsFeed.Api.Tests;

public sealed class FeedPersonalizationServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 1, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Rank_ColdStart_OrdersNewestFirst()
    {
        var service = CreateService();
        var candidates = new[]
        {
            Article(id: 1, category: "Local", hoursAgo: 30),
            Article(id: 2, category: "Health", hoursAgo: 1),
            Article(id: 3, category: "Sports", hoursAgo: 10),
        };

        var ranked = service.Rank(candidates, PersonalizationSignals.Empty, Now);

        Assert.Equal([2, 3, 1], ranked.Select(a => a.Id).ToArray());
    }

    [Fact]
    public void Rank_AffinityBoostsPreferredCategoryAboveFresherStories()
    {
        var service = CreateService();
        var freshUnpreferred = Article(id: 1, category: "Local", hoursAgo: 0);
        var olderPreferred = Article(id: 2, category: "Health", hoursAgo: 12);
        var signals = Signals(affinity: new Dictionary<string, double> { ["Health"] = 1.0 });

        var ranked = service.Rank([freshUnpreferred, olderPreferred], signals, Now);

        Assert.Equal([2, 1], ranked.Select(a => a.Id).ToArray());
    }

    [Fact]
    public void Rank_SeenStoriesDropBelowUnseen()
    {
        var service = CreateService();
        var seenFresh = Article(id: 1, category: "Local", hoursAgo: 0);
        var unseenSlightlyOlder = Article(id: 2, category: "Local", hoursAgo: 6);
        var signals = Signals(seen: new HashSet<int> { 1 });

        var ranked = service.Rank([seenFresh, unseenSlightlyOlder], signals, Now);

        Assert.Equal([2, 1], ranked.Select(a => a.Id).ToArray());
    }

    [Fact]
    public void Rank_TrendingBoostBreaksTieTowardPopularStory()
    {
        var service = CreateService();
        var quiet = Article(id: 1, category: "Local", hoursAgo: 5);
        var hot = Article(id: 2, category: "Local", hoursAgo: 5);
        var signals = Signals(trending: new Dictionary<int, double> { [2] = 1.0 });

        var ranked = service.Rank([quiet, hot], signals, Now);

        Assert.Equal([2, 1], ranked.Select(a => a.Id).ToArray());
    }

    [Fact]
    public void Rank_BreaksSameSourceStreaks()
    {
        var service = CreateService();
        var candidates = new[]
        {
            Article(id: 1, category: "Local", hoursAgo: 1, source: "Daily A"),
            Article(id: 2, category: "Local", hoursAgo: 2, source: "Daily A"),
            Article(id: 3, category: "Local", hoursAgo: 3, source: "Daily A"),
            Article(id: 4, category: "Local", hoursAgo: 4, source: "Daily A"),
            Article(id: 5, category: "Local", hoursAgo: 5, source: "Weekly B"),
        };

        var ranked = service.Rank(candidates, PersonalizationSignals.Empty, Now);

        Assert.Equal([1, 2, 5, 3, 4], ranked.Select(a => a.Id).ToArray());
    }

    [Fact]
    public void Rank_IsDeterministicForIdenticalTimestamps()
    {
        var service = CreateService();
        var candidates = new[]
        {
            Article(id: 1, category: "Local", hoursAgo: 2),
            Article(id: 3, category: "Local", hoursAgo: 2),
            Article(id: 2, category: "Local", hoursAgo: 2),
        };

        var ranked = service.Rank(candidates, PersonalizationSignals.Empty, Now);

        Assert.Equal([3, 2, 1], ranked.Select(a => a.Id).ToArray());
    }

    [Fact]
    public async Task LoadSignals_NormalizesAffinityAndSeenFromSessionHistory()
    {
        var db = CreateDbContext();
        var health1 = Article(id: 1, category: "Health", hoursAgo: 3);
        var health2 = Article(id: 2, category: "Health", hoursAgo: 4);
        var local = Article(id: 3, category: "Local", hoursAgo: 5);
        db.Articles.AddRange(health1, health2, local);
        db.ArticleViews.AddRange(
            new ArticleView { ArticleId = 1, SessionKey = "s1", ViewedAt = Now.AddHours(-1) },
            new ArticleView { ArticleId = 2, SessionKey = "s1", ViewedAt = Now.AddHours(-2) },
            new ArticleView { ArticleId = 2, SessionKey = "s1", ViewedAt = Now.AddHours(-3) },
            new ArticleView { ArticleId = 3, SessionKey = "s1", ViewedAt = Now.AddHours(-4) },
            new ArticleView { ArticleId = 3, SessionKey = "other", ViewedAt = Now.AddHours(-1) });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var signals = await service.LoadSignalsAsync(
            cityId: 2, sessionKey: "s1", candidateIds: [1, 2, 3], now: Now, CancellationToken.None);

        Assert.Equal(1.0, signals.CategoryAffinity["Health"]);
        Assert.Equal(1.0 / 3.0, signals.CategoryAffinity["Local"], precision: 5);
        Assert.Equal(new[] { 1, 2, 3 }.ToHashSet(), signals.SeenArticleIds);
        // Trending: article 2 has 2 city views in 24h, 1 and 3 have 1 each.
        Assert.Equal(1.0, signals.TrendingScores[2]);
        Assert.Equal(0.5, signals.TrendingScores[1]);
    }

    [Fact]
    public async Task LoadSignals_ClassifiesViewedArticlesByContent()
    {
        var db = CreateDbContext();
        // Stored as "Local" at ingest, but the text is clearly a health story.
        var miscategorized = Article(
            id: 1, category: "Local", hoursAgo: 3,
            headline: "New vaccine drive at district hospital");
        var plainLocal = Article(id: 2, category: "Local", hoursAgo: 4);
        db.Articles.AddRange(miscategorized, plainLocal);
        db.ArticleViews.AddRange(
            new ArticleView { ArticleId = 1, SessionKey = "s1", ViewedAt = Now.AddHours(-1) },
            new ArticleView { ArticleId = 2, SessionKey = "s1", ViewedAt = Now.AddHours(-2) });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var signals = await service.LoadSignalsAsync(
            cityId: 2, sessionKey: "s1", candidateIds: [1, 2], now: Now, CancellationToken.None);

        // Affinity keys follow the content-analyzed category so they line up with
        // feed section keys; the genuinely local story still keys as Local.
        Assert.Equal(1.0, signals.CategoryAffinity["Health"]);
        Assert.Equal(1.0, signals.CategoryAffinity["Local"]);
        Assert.False(signals.CategoryAffinity.ContainsKey("Sports"));
    }

    [Fact]
    public void Rank_AffinityAppliesToContentClassifiedCategory()
    {
        var service = CreateService();
        // Stored "Local" but content-classified as Health; Health affinity boosts it.
        var healthInLocalClothing = Article(
            id: 1, category: "Local", hoursAgo: 12,
            headline: "New vaccine drive at district hospital");
        var freshUnpreferred = Article(id: 2, category: "Local", hoursAgo: 0);
        var signals = Signals(affinity: new Dictionary<string, double> { ["Health"] = 1.0 });

        var ranked = service.Rank([freshUnpreferred, healthInLocalClothing], signals, Now);

        Assert.Equal([1, 2], ranked.Select(a => a.Id).ToArray());
    }

    [Fact]
    public async Task LoadSignals_NoSession_ReturnsOnlyTrending()
    {
        var db = CreateDbContext();
        db.Articles.Add(Article(id: 1, category: "Local", hoursAgo: 2));
        db.ArticleViews.Add(new ArticleView
        {
            ArticleId = 1,
            SessionKey = "someone",
            ViewedAt = Now.AddHours(-1),
        });
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var signals = await service.LoadSignalsAsync(
            cityId: 2, sessionKey: null, candidateIds: [1], now: Now, CancellationToken.None);

        Assert.Empty(signals.CategoryAffinity);
        Assert.Empty(signals.SeenArticleIds);
        Assert.Equal(1.0, signals.TrendingScores[1]);
    }

    private static FeedPersonalizationService CreateService(AppDbContext? db = null) =>
        new(
            db ?? CreateDbContext(),
            Microsoft.Extensions.Options.Options.Create(new FeedPersonalizationOptions()));

    private static AppDbContext CreateDbContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"personalization-{Guid.NewGuid():N}")
            .Options);

    private static PersonalizationSignals Signals(
        IReadOnlyDictionary<string, double>? affinity = null,
        IReadOnlyDictionary<int, double>? trending = null,
        IReadOnlySet<int>? seen = null) =>
        new(
            affinity ?? new Dictionary<string, double>(),
            trending ?? new Dictionary<int, double>(),
            seen ?? new HashSet<int>());

    private static Article Article(
        int id,
        string category,
        double hoursAgo,
        string source = "SourceA",
        string? headline = null) =>
        new()
        {
            Id = id,
            CityId = 2,
            Headline = headline ?? $"Story {id}",
            Summary = "s",
            SourceName = source,
            SourceUrl = $"https://example.com/story-{id}",
            PublishedAt = Now.AddHours(-hoursAgo),
            Category = category,
            Status = ArticleStatus.Published,
            IsMock = false,
            DetectedLanguage = "en",
        };
}
