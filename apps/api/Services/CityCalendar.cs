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

    private static readonly Lazy<TimeZoneInfo> IndiaTz = new(() =>
        ResolveNamedOrFixedIst(DefaultIanaId, "India Standard Time"));

    public static TimeZoneInfo ResolveTimeZone(City? city = null) => IndiaTz.Value;

    /// <summary>
    /// Resolves IST from the host timezone database, then a fixed UTC+5:30 zone.
    /// Slim Linux images often lack tzdata, so both IANA and Windows IDs can throw.
    /// </summary>
    public static TimeZoneInfo ResolveNamedOrFixedIst(params string[] ids)
    {
        foreach (var id in ids)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                continue;
            }

            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(id);
            }
            catch (TimeZoneNotFoundException)
            {
            }
            catch (InvalidTimeZoneException)
            {
            }
        }

        return TimeZoneInfo.CreateCustomTimeZone(
            DefaultIanaId,
            TimeSpan.FromHours(5.5),
            "India Standard Time",
            "India Standard Time");
    }

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
        // Npgsql only accepts timestamptz parameters with offset 0.
        var startUtc = new DateTimeOffset(startLocal, offset).ToUniversalTime();
        return (startUtc, startUtc.AddDays(1));
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
}
