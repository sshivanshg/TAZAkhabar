using NewsFeed.Api.Ingest;

namespace NewsFeed.Api.Tests;

public sealed class SafeHttpTests
{
    [Theory]
    [InlineData("http://127.0.0.1/")]
    [InlineData("http://10.0.0.1/")]
    [InlineData("http://localhost/")]
    [InlineData("http://192.168.1.1/")]
    [InlineData("http://172.16.0.1/")]
    [InlineData("http://169.254.169.254/")]
    [InlineData("http://[::1]/")]
    [InlineData("file:///etc/passwd")]
    [InlineData("file://")]
    [InlineData("ftp://www.amarujala.com/x")]
    [InlineData("javascript:alert(1)")]
    [InlineData("not-a-url")]
    [InlineData("")]
    public void RejectsPrivateLoopbackAndNonHttp(string url)
    {
        Assert.False(SafeHttp.TryValidatePublicAbsoluteUri(url, out _, out var error));
        Assert.False(string.IsNullOrWhiteSpace(error));
    }

    [Fact]
    public void RejectsNull()
    {
        Assert.False(SafeHttp.TryValidatePublicAbsoluteUri(null, out _, out var error));
        Assert.False(string.IsNullOrWhiteSpace(error));
    }

    [Fact]
    public void AcceptsPublicHttps()
    {
        Assert.True(SafeHttp.TryValidatePublicAbsoluteUri(
            "https://www.amarujala.com/x",
            out var uri,
            out var error));

        Assert.Equal(Uri.UriSchemeHttps, uri.Scheme);
        Assert.Equal("www.amarujala.com", uri.Host);
        Assert.Equal("/x", uri.AbsolutePath);
        Assert.True(string.IsNullOrEmpty(error));
    }
}
