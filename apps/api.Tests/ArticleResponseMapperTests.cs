using NewsFeed.Api.Data;
using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Services;

namespace NewsFeed.Api.Tests;

public sealed class ArticleResponseMapperTests
{
    [Fact]
    public void ToOriginal_RespectsBodyVisibilityAndEffectiveCategory()
    {
        var article = Article();
        var mapper = new ArticleResponseMapper();

        var listItem = mapper.ToOriginal(article);
        var detail = mapper.ToOriginal(article, includeBody: true);

        Assert.Null(listItem.Body);
        Assert.Equal("Full body", detail.Body);
        Assert.Equal("Health", detail.Category);
        Assert.Equal("en", detail.DisplayLanguage);
    }

    [Fact]
    public void ToTranslated_UsesTranslatedFieldsAndNeverExposesOriginalBody()
    {
        var response = new ArticleResponseMapper().ToTranslated(
            Article(),
            detectedLanguage: "hi",
            displayLanguage: "en",
            headline: "Translated headline",
            summary: "Translated summary");

        Assert.Equal("Translated headline", response.Headline);
        Assert.Equal("Translated summary", response.Summary);
        Assert.Null(response.Body);
        Assert.Equal("hi", response.DetectedLanguage);
        Assert.Equal("en", response.DisplayLanguage);
    }

    private static Article Article() => new()
    {
        Id = 1,
        CityId = 2,
        Headline = "New vaccine drive at district hospital",
        Summary = "Health teams announce a new vaccination program.",
        Body = "Full body",
        SourceName = "Test source",
        SourceUrl = "https://example.com/story",
        PublishedAt = DateTimeOffset.UtcNow,
        Category = "Local",
        DetectedLanguage = "en",
        Status = ArticleStatus.Published,
    };
}
