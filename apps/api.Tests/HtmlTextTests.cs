using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class HtmlTextTests
{
    [Fact]
    public void ToPlainText_StripsTagsAndDecodesEntities()
    {
        var input = "<p>झांसी &amp; <b>Orchha</b></p><script>alert(1)</script>";
        var text = HtmlText.ToPlainText(input);
        Assert.Equal("झांसी & Orchha", text);
        Assert.DoesNotContain("<", text);
        Assert.DoesNotContain("alert", text);
    }

    [Fact]
    public void Truncate_CapsLengthWithoutBreakingRequiredNonEmpty()
    {
        var text = new string('अ', 50);
        Assert.Equal(40, HtmlText.Truncate(text, 40).Length);
    }
}
