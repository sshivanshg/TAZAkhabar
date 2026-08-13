using NewsFeed.Api.Data.Entities;

namespace NewsFeed.Api.Services;

/// <summary>
/// Resolves city-local calendar days for edition browsing.
/// All MVP cities are in India; timezone is Asia/Kolkata (IST, UTC+5:30).
/// </summary>
public static class CityCalendar
{
    public const string DefaultIanaId = "Asia/Kolkata";
    public const int DefaultDatesWindowDays = 30;

    private static readonly Lazy<TimeZoneInfo> IndiaTz = new(ResolveIndiaTimeZone);

    public static TimeZoneInfo ResolveTimeZone(City? city = null) => IndiaTz.Value;

    public static DateOnly TodayLocal(City? city = null) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, ResolveTimeZone(city)).DateTime);

    /// <summary>
    /// Inclusive start / exclusive end UTC bounds for a city-local calendar date.
    /// </summary>
    public static (DateTimeOffset StartUtc, DateTimeOffset EndUtc) UtcBoundsForLocalDate(
        DateOnly localDate,
        City? city = null)
    {
        var tz = ResolveTimeZone(city);
        var startLocal = localDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
        var offset = tz.GetUtcOffset(startLocal);
        var start = new DateTimeOffset(startLocal, offset);
        return (start, start.AddDays(1));
    }

    public static DateOnly ToLocalDate(DateTimeOffset utcInstant, City? city = null)
    {
        var local = TimeZoneInfo.ConvertTime(utcInstant, ResolveTimeZone(city));
        return DateOnly.FromDateTime(local.DateTime);
    }

    public static bool TryParseDateParam(string? date, out DateOnly localDate, out string? error)
    {
        localDate = default;
        error = null;
        if (string.IsNullOrWhiteSpace(date))
        {
            return false;
        }

        if (!DateOnly.TryParseExact(
                date.Trim(),
                "yyyy-MM-dd",
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None,
                out localDate))
        {
            error = "Query parameter 'date' must be YYYY-MM-DD.";
            return false;
        }

        return true;
    }

    private static TimeZoneInfo ResolveIndiaTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(DefaultIanaId);
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
        }
        catch (InvalidTimeZoneException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
        }
    }
}
