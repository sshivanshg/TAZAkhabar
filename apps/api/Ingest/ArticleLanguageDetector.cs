using System.Text;

namespace NewsFeed.Api.Ingest;

/// <summary>
/// Lightweight script-based language ID for v1 (Hindi Devanagari vs Latin/English).
/// Extensible via <see cref="Normalize"/> for additional ISO 639-1 codes later.
/// </summary>
public static class ArticleLanguageDetector
{
    public const string DefaultLanguage = "en";

    /// <summary>Client UI / preference picker list — not a schema constraint.</summary>
    public static readonly string[] SupportedReadingLanguages = ["en", "hi"];

    public static string Detect(string? headline, string? summary, string? fallback = null)
    {
        var text = $"{headline ?? ""} {summary ?? ""}";
        var letters = 0;
        var devanagari = 0;
        foreach (var rune in text.EnumerateRunes())
        {
            if (!Rune.IsLetter(rune))
            {
                continue;
            }

            letters++;
            if (IsDevanagari(rune.Value))
            {
                devanagari++;
            }
        }

        if (letters == 0)
        {
            return Normalize(fallback) ?? DefaultLanguage;
        }

        // Majority Devanagari letters ⇒ Hindi; otherwise English (Latin-heavy text).
        if (devanagari * 2 >= letters)
        {
            return "hi";
        }

        return Normalize(fallback) ?? DefaultLanguage;
    }

    public static string? Normalize(string? code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return null;
        }

        var trimmed = code.Trim().ToLowerInvariant();
        return trimmed switch
        {
            "en" or "eng" or "english" => "en",
            "hi" or "hin" or "hindi" => "hi",
            _ when trimmed.Length is >= 2 and <= 8
                && trimmed.All(c => c is (>= 'a' and <= 'z') or '-') => trimmed[..Math.Min(trimmed.Length, 8)],
            _ => null,
        };
    }

    public static string CoerceOrDetect(string? explicitLanguage, string? headline, string? summary, string? fallback = null)
    {
        return Normalize(explicitLanguage) ?? Detect(headline, summary, fallback);
    }

    public static bool IsSupportedReadingLanguage(string? code)
    {
        var normalized = Normalize(code);
        return normalized is not null
            && SupportedReadingLanguages.Contains(normalized, StringComparer.Ordinal);
    }

    private static bool IsDevanagari(int codePoint) =>
        codePoint is >= 0x0900 and <= 0x097F;
}
