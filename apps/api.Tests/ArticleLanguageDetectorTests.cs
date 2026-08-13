using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class ArticleLanguageDetectorTests
{
    [Fact]
    public void Detect_HindiDevanagari_ReturnsHi()
    {
        var lang = ArticleLanguageDetector.Detect(
            "झांसी में गर्मी से राहत",
            "नगर निगम ने जल केंद्र शुरू किए।");
        Assert.Equal("hi", lang);
    }

    [Fact]
    public void Detect_English_ReturnsEn()
    {
        var lang = ArticleLanguageDetector.Detect(
            "Local municipal budget approved",
            "The Jhansi Municipal Corporation cleared the annual budget.");
        Assert.Equal("en", lang);
    }

    [Fact]
    public void Detect_Empty_UsesFallback()
    {
        Assert.Equal("hi", ArticleLanguageDetector.Detect("", "", fallback: "hi"));
        Assert.Equal("en", ArticleLanguageDetector.Detect(null, null));
    }

    [Theory]
    [InlineData("EN", "en")]
    [InlineData("hindi", "hi")]
    [InlineData("eng", "en")]
    [InlineData("fr", "fr")]
    public void Normalize_AcceptsAliasesAndIso(string input, string expected)
    {
        Assert.Equal(expected, ArticleLanguageDetector.Normalize(input));
    }
}
