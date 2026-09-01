using Microsoft.EntityFrameworkCore;
using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Options;
using NewsFeed.Api.Services;

namespace NewsFeed.Api.Tests;

public sealed class FeedSectionBuilderTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 1, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Build_TopSection_HoldsFirstFiveRanked()
    {
        var ranked = Enumerable.Range(1, 8)
            .Select(id => Article(id: id, category: "Local", hoursAgo: id))
            .ToList();

        var sections = FeedSectionBuilder.Build(ranked, PersonalizationSignals.Empty, perSectionLimit: 8);

        Assert.Equal("top", sections[0].Key);
        Assert.Equal("Top stories", sections[0].Title);
        Assert.Null(sections[0].Category);
        Assert.Equal([1, 2, 3, 4, 5], sections[0].Articles.Select(a => a.Id).ToArray());
    }

    [Fact]
    public void Build_OrdersCategorySectionsBySessionAffinity()
    {
        // Ranked order interleaves categories; Local has the best-ranked story.
        var ranked = new[]
        {
            Article(id: 1, category: "Local", hoursAgo: 1),
            Article(id: 2, category: "Sports", hoursAgo: 2),
            Article(id: 3, category: "Health", hoursAgo: 3),
            Article(id: 4, category: "Local", hoursAgo: 4),
            Article(id: 5, category: "Sports", hoursAgo: 5),
            Article(id: 6, category: "Health", hoursAgo: 6),
            Article(id: 7, category: "Local", hoursAgo: 7),
            Article(id: 8, category: "Sports", hoursAgo: 8),
            Article(id: 9, category: "Health", hoursAgo: 9),
        };
        var signals = new PersonalizationSignals(
            new Dictionary<string, double> { ["Health"] = 1.0, ["Sports"] = 0.5 },
            new Dictionary<int, double>(),
            new HashSet<int>());

        var sections = FeedSectionBuilder.Build(ranked, signals, perSectionLimit: 8);

        Assert.Equal(
            ["top", "health", "sports", "local"],
            sections.Select(s => s.Key).ToArray());
        Assert.Equal("Health", sections[1].Title);
        Assert.Equal("Health", sections[1].Category);
        // Article 3 sits inside the top section; the Health section gets the rest.
        Assert.Equal([6, 9], sections[1].Articles.Select(a => a.Id).ToArray());
    }

    [Fact]
    public void Build_ZeroAffinitySections_OrderedByBestRankedStory()
    {
        var ranked = new[]
        {
            Article(id: 1, category: "Local", hoursAgo: 1),
            Article(id: 2, category: "Local", hoursAgo: 2),
            Article(id: 3, category: "Local", hoursAgo: 3),
            Article(id: 4, category: "Local", hoursAgo: 4),
            Article(id: 5, category: "Local", hoursAgo: 5),
            Article(id: 6, category: "Sports", hoursAgo: 6),
            Article(id: 7, category: "Health", hoursAgo: 7),
            Article(id: 8, category: "Business", hoursAgo: 8),
        };

        var sections = FeedSectionBuilder.Build(ranked, PersonalizationSignals.Empty, perSectionLimit: 8);

        Assert.Equal(
            ["top", "sports", "health", "business"],
            sections.Select(s => s.Key).ToArray());
    }

    [Fact]
    public void Build_PerSectionLimitOverflow_LandsInMoreStories()
    {
        var ranked = Enumerable.Range(1, 14)
            .Select(id => Article(id: id, category: "Health", hoursAgo: id))
            .ToList();

        var sections = FeedSectionBuilder.Build(ranked, PersonalizationSignals.Empty, perSectionLimit: 3);

        Assert.Equal(["top", "health", "more"], sections.Select(s => s.Key).ToArray());
        Assert.Equal([1, 2, 3, 4, 5], sections[0].Articles.Select(a => a.Id).ToArray());
        Assert.Equal([6, 7, 8], sections[1].Articles.Select(a => a.Id).ToArray());
        var more = sections[2];
        Assert.Equal("More stories", more.Title);
        Assert.Null(more.Category);
        Assert.Equal([9, 10, 11, 12, 13, 14], more.Articles.Select(a => a.Id).ToArray());
    }

    [Fact]
    public void Build_EmptyPool_ReturnsNoSections()
    {
        var sections = FeedSectionBuilder.Build([], PersonalizationSignals.Empty, perSectionLimit: 8);

        Assert.Empty(sections);
    }

    [Fact]
    public void Build_ContentClassification_MovesStoryToEffectiveCategorySection()
    {
        // Stored "Local" but the text is clearly a health story.
        var miscategorized = Article(
            id: 6, category: "Local", hoursAgo: 6,
            headline: "New vaccine drive at district hospital");
        var ranked = new[]
        {
            Article(id: 1, category: "Local", hoursAgo: 1),
            Article(id: 2, category: "Local", hoursAgo: 2),
            Article(id: 3, category: "Local", hoursAgo: 3),
            Article(id: 4, category: "Local", hoursAgo: 4),
            Article(id: 5, category: "Local", hoursAgo: 5),
            miscategorized,
        };

        var sections = FeedSectionBuilder.Build(ranked, PersonalizationSignals.Empty, perSectionLimit: 8);

        var health = Assert.Single(sections.Where(s => s.Key == "health"));
        Assert.Equal([6], health.Articles.Select(a => a.Id).ToArray());
        Assert.DoesNotContain(sections, s => s.Key == "local");
    }

    [Fact]
    public void Build_ClassifierNotConfident_KeepsStoredCategorySection()
    {
        var ranked = new[]
        {
            Article(id: 1, category: "Local", hoursAgo: 1),
            Article(id: 2, category: "Local", hoursAgo: 2),
            Article(id: 3, category: "Local", hoursAgo: 3),
            Article(id: 4, category: "Local", hoursAgo: 4),
            Article(id: 5, category: "Local", hoursAgo: 5),
            Article(id: 6, category: "Business", hoursAgo: 6, headline: "Quiet day in the old quarter"),
        };

        var sections = FeedSectionBuilder.Build(ranked, PersonalizationSignals.Empty, perSectionLimit: 8);

        var business = Assert.Single(sections.Where(s => s.Key == "business"));
        Assert.Equal([6], business.Articles.Select(a => a.Id).ToArray());
    }

    [Fact]
    public void Build_SeenStories_StayDemotedWithinTheirSection()
    {
        var service = new FeedPersonalizationService(
            CreateDbContext(),
            Microsoft.Extensions.Options.Options.Create(new FeedPersonalizationOptions()));
        var candidates = new[]
        {
            Article(id: 10, category: "Local", hoursAgo: 0),
            Article(id: 11, category: "Local", hoursAgo: 1),
            Article(id: 12, category: "Local", hoursAgo: 2),
            Article(id: 13, category: "Local", hoursAgo: 3),
            Article(id: 14, category: "Local", hoursAgo: 4),
            // Fresher but already seen; must rank below the unseen Health story.
            Article(id: 2, category: "Health", hoursAgo: 5),
            Article(id: 1, category: "Health", hoursAgo: 6),
        };
        var signals = new PersonalizationSignals(
            new Dictionary<string, double>(),
            new Dictionary<int, double>(),
            new HashSet<int> { 2 });

        var ranked = service.Rank(candidates, signals, Now);
        var sections = FeedSectionBuilder.Build(ranked, signals, perSectionLimit: 8);

        var health = Assert.Single(sections.Where(s => s.Key == "health"));
        Assert.Equal([1, 2], health.Articles.Select(a => a.Id).ToArray());
    }

    [Fact]
    public void Build_ColdStart_IsDeterministic()
    {
        var ranked = new[]
        {
            Article(id: 1, category: "Local", hoursAgo: 1),
            Article(id: 2, category: "Sports", hoursAgo: 2),
            Article(id: 3, category: "Health", hoursAgo: 3),
            Article(id: 4, category: "Local", hoursAgo: 4),
            Article(id: 5, category: "Sports", hoursAgo: 5),
            Article(id: 6, category: "Health", hoursAgo: 6),
            Article(id: 7, category: "Business", hoursAgo: 7),
        };

        var first = FeedSectionBuilder.Build(ranked, PersonalizationSignals.Empty, perSectionLimit: 8);
        var second = FeedSectionBuilder.Build(ranked, PersonalizationSignals.Empty, perSectionLimit: 8);

        string Flatten(IReadOnlyList<FeedSectionArticles> sections) =>
            string.Join("|", sections.Select(s => $"{s.Key}:{string.Join(",", s.Articles.Select(a => a.Id))}"));

        Assert.Equal(Flatten(first), Flatten(second));
        Assert.Equal("top:1,2,3,4,5|health:6|business:7", Flatten(first));
    }

    [Theory]
    [InlineData("Health", "health")]
    [InlineData("Local", "local")]
    [InlineData("Science & Tech", "science-tech")]
    public void Slugify_ProducesStableKeys(string category, string expected)
    {
        Assert.Equal(expected, FeedSectionBuilder.Slugify(category));
    }

    private static AppDbContext CreateDbContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"sections-{Guid.NewGuid():N}")
            .Options);

    private static Article Article(int id, string category, double hoursAgo, string? headline = null) =>
        new()
        {
            Id = id,
            CityId = 2,
            Headline = headline ?? $"Story {id}",
            Summary = "s",
            SourceName = "SourceA",
            SourceUrl = $"https://example.com/story-{id}",
            PublishedAt = Now.AddHours(-hoursAgo),
            Category = category,
            Status = ArticleStatus.Published,
            IsMock = false,
            DetectedLanguage = "en",
        };
}
