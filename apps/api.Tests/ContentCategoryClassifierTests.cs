using NewsFeed.Api.Services;

namespace NewsFeed.Api.Tests;

public sealed class ContentCategoryClassifierTests
{
    [Theory]
    // English keyword hits per category
    [InlineData("New vaccine drive at district hospital", "Health")]
    [InlineData("Cricket team wins thrilling match at stadium", "Sports")]
    [InlineData("Sensex rallies as banks post record profits", "Business")]
    [InlineData("Chief minister announces new scheme in assembly", "State")]
    [InlineData("Mayor inspects ward roads after waterlogging", "Local")]
    // Hindi (Devanagari) keyword hits per category
    [InlineData("अस्पताल में नए डॉक्टर नियुक्त", "Health")]
    [InlineData("क्रिकेट मैच में टीम की शानदार जीत", "Sports")]
    [InlineData("बैंक घोटाले में कार्रवाई, शेयर बाजार में गिरावट", "Business")]
    [InlineData("मुख्यमंत्री ने विधानसभा में नई योजना की घोषणा", "State")]
    [InlineData("नगर निगम ने वार्ड 12 में सफाई अभियान शुरू किया", "Local")]
    public void Classify_KeywordHits_ReturnsExpectedCategory(string headline, string expected)
    {
        var match = ContentCategoryClassifier.Classify(headline, summary: null);

        Assert.NotNull(match);
        Assert.Equal(expected, match.Category);
        Assert.InRange(match.Confidence, 0.6, 1.0);
    }

    [Fact]
    public void Classify_SummaryOnly_StillClassifies()
    {
        var match = ContentCategoryClassifier.Classify(
            headline: "Big announcement made on Tuesday",
            summary: "The cricket tournament begins at the stadium next week.");

        Assert.NotNull(match);
        Assert.Equal("Sports", match.Category);
    }

    [Fact]
    public void Classify_AmbiguousContent_ReturnsNull()
    {
        // State (minister) and Health (hospital) tie — no clear winner.
        var match = ContentCategoryClassifier.Classify("Minister visits hospital", summary: null);

        Assert.Null(match);
    }

    [Fact]
    public void Classify_NoKeywordEvidence_ReturnsNull()
    {
        var match = ContentCategoryClassifier.Classify(
            "Big day arrives tomorrow", "Residents gathered to celebrate the occasion.");

        Assert.Null(match);
    }

    [Fact]
    public void Classify_WordBoundaries_PreventSubstringFalsePositives()
    {
        // "matching" must not hit the sports keyword "match".
        var match = ContentCategoryClassifier.Classify(
            "Matching funds program announced", "The matching grant helps families.");

        Assert.Null(match);
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData("", "")]
    [InlineData("   ", "  ")]
    public void Classify_EmptyInput_ReturnsNull(string? headline, string? summary)
    {
        Assert.Null(ContentCategoryClassifier.Classify(headline, summary));
    }

    [Fact]
    public void EffectiveCategory_ConfidentClassification_OverridesStoredCategory()
    {
        var effective = ContentCategoryClassifier.EffectiveCategory(
            "Local", "New vaccine drive at district hospital", null);

        Assert.Equal("Health", effective);
    }

    [Fact]
    public void EffectiveCategory_NotConfident_KeepsStoredCategory()
    {
        var effective = ContentCategoryClassifier.EffectiveCategory(
            "Business", "Big day arrives tomorrow", "Residents gathered to celebrate.");

        Assert.Equal("Business", effective);
    }
}
