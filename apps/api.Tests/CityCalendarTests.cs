using NewsFeed.Api.Services;

namespace NewsFeed.Api.Tests;

public sealed class CityCalendarTests
{
    [Fact]
    public void UtcBoundsForLocalDate_SpansFullIstDay()
    {
        var day = new DateOnly(2026, 8, 14);
        var (start, end) = CityCalendar.UtcBoundsForLocalDate(day);

        // IST = UTC+5:30 → local midnight 14 Aug = 13 Aug 18:30 UTC
        Assert.Equal(new DateTimeOffset(2026, 8, 13, 18, 30, 0, TimeSpan.Zero), start.ToUniversalTime());
        Assert.Equal(new DateTimeOffset(2026, 8, 14, 18, 30, 0, TimeSpan.Zero), end.ToUniversalTime());
        Assert.Equal(TimeSpan.FromHours(24), end - start);
    }

    [Fact]
    public void ToLocalDate_ConvertsUtcNearMidnightAcrossIstBoundary()
    {
        // 13 Aug 2026 20:00 UTC = 14 Aug 2026 01:30 IST
        var utc = new DateTimeOffset(2026, 8, 13, 20, 0, 0, TimeSpan.Zero);
        Assert.Equal(new DateOnly(2026, 8, 14), CityCalendar.ToLocalDate(utc));

        // 13 Aug 2026 18:00 UTC = 13 Aug 2026 23:30 IST
        var stillPrevDay = new DateTimeOffset(2026, 8, 13, 18, 0, 0, TimeSpan.Zero);
        Assert.Equal(new DateOnly(2026, 8, 13), CityCalendar.ToLocalDate(stillPrevDay));
    }

    [Fact]
    public void TryParseDateParam_RejectsInvalid()
    {
        Assert.False(CityCalendar.TryParseDateParam("14-08-2026", out _, out var error));
        Assert.Contains("YYYY-MM-DD", error);
        Assert.False(CityCalendar.TryParseDateParam("", out _, out _));
        Assert.True(CityCalendar.TryParseDateParam("2026-08-14", out var ok, out _));
        Assert.Equal(new DateOnly(2026, 8, 14), ok);
    }
}
