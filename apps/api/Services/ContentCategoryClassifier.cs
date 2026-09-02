using System.Text.RegularExpressions;

namespace NewsFeed.Api.Services;

/// <summary>A confident content-based category assignment for an article.</summary>
public sealed record ContentCategoryMatch(string Category, double Confidence);

/// <summary>
/// Deterministic keyword/rule classifier over headline + summary text. Stored
/// categories come from source/feed defaults at ingest, so a sports story filed
/// under a source's default "Local" lands in the wrong section. This classifier
/// re-derives the effective category from the article text itself (English and
/// Hindi/Devanagari keyword sets) and is used on the fly only — never persisted,
/// never applied to e-paper edition rows (those are filtered out upstream).
/// Returns null when evidence is weak or ambiguous so callers fall back to the
/// stored category.
/// </summary>
public static class ContentCategoryClassifier
{
    /// <summary>Headline hits weigh double — headlines are the densest signal.</summary>
    private const double HeadlineMultiplier = 2.0;

    /// <summary>Minimum weighted evidence before any classification is emitted.</summary>
    private const double MinScore = 3.0;

    /// <summary>Winner must hold at least this share of top + runner-up score.</summary>
    private const double MinConfidence = 0.6;

    private static readonly CategoryRules[] RuleSets =
    [
        new("Health",
        [
            // English — strong
            K("health", 2), K("healthcare", 2), K("hospital", 2), K("hospitals", 2),
            K("doctor", 2), K("doctors", 2), K("patient", 2), K("patients", 2),
            K("clinic", 2), K("clinics", 2), K("medical", 2), K("medicine", 2),
            K("vaccine", 2), K("vaccines", 2), K("vaccination", 2), K("virus", 2),
            K("covid", 2), K("coronavirus", 2), K("dengue", 2), K("malaria", 2),
            K("typhoid", 2), K("cancer", 2), K("diabetes", 2), K("surgery", 2),
            K("treatment", 2), K("disease", 2), K("epidemic", 2), K("pandemic", 2),
            K("symptoms", 2), K("diagnosis", 2), K("nurse", 2), K("nurses", 2),
            K("blood test", 2), K("heart attack", 2), K("mental health", 2),
            // English — weak
            K("fever", 1), K("immunity", 1), K("wellness", 1), K("pharmacy", 1),
            // Hindi — strong
            K("स्वास्थ्य", 2), K("अस्पताल", 2), K("हॉस्पिटल", 2), K("डॉक्टर", 2),
            K("मरीज", 2), K("इलाज", 2), K("उपचार", 2), K("दवा", 2), K("वैक्सीन", 2),
            K("टीकाकरण", 2), K("टीका", 2), K("चिकित्सा", 2), K("बीमारी", 2),
            K("डेंगू", 2), K("मलेरिया", 2), K("कैंसर", 2), K("मधुमेह", 2),
            K("ऑपरेशन", 2), K("लक्षण", 2), K("नर्स", 2), K("क्लीनिक", 2),
            // Hindi — weak
            K("बुखार", 1), K("तबीयत", 1),
        ]),
        new("Sports",
        [
            // English — strong
            K("cricket", 2), K("cricketer", 2), K("wicket", 2), K("wickets", 2),
            K("innings", 2), K("bowler", 2), K("batsman", 2), K("batsmen", 2),
            K("football", 2), K("hockey", 2), K("tennis", 2), K("badminton", 2),
            K("kabaddi", 2), K("olympic", 2), K("olympics", 2), K("tournament", 2),
            K("league", 2), K("ipl", 2), K("t20", 2), K("odi", 2), K("test match", 2),
            K("stadium", 2), K("medal", 2), K("medals", 2), K("athlete", 2),
            K("world cup", 2), K("semifinal", 2), K("semi-final", 2),
            // English — weak
            K("match", 1), K("matches", 1), K("team", 1), K("teams", 1),
            K("player", 1), K("players", 1), K("coach", 1), K("goal", 1), K("goals", 1),
            // Hindi — strong
            K("क्रिकेट", 2), K("खेल", 2), K("खिलाड़ी", 2), K("मैच", 2),
            K("विकेट", 2), K("गेंदबाज", 2), K("बल्लेबाज", 2), K("ओवर", 2),
            K("फुटबॉल", 2), K("हॉकी", 2), K("टेनिस", 2), K("बैडमिंटन", 2),
            K("कबड्डी", 2), K("ओलंपिक", 2), K("टूर्नामेंट", 2), K("लीग", 2),
            K("स्टेडियम", 2), K("पदक", 2),
            // Hindi — weak
            K("टीम", 1), K("गेंद", 1), K("गोल", 1),
        ]),
        new("Business",
        [
            // English — strong
            K("business", 2), K("stocks", 2), K("shares", 2), K("sensex", 2),
            K("nifty", 2), K("bank", 2), K("banks", 2), K("banking", 2), K("rbi", 2),
            K("gst", 2), K("economy", 2), K("economic", 2), K("inflation", 2),
            K("investment", 2), K("investors", 2), K("profit", 2), K("profits", 2),
            K("revenue", 2), K("ipo", 2), K("startup", 2), K("startups", 2),
            K("trade", 2), K("export", 2), K("exports", 2), K("import", 2),
            K("imports", 2), K("finance", 2), K("financial", 2), K("fiscal", 2),
            K("company", 2), K("companies", 2), K("industry", 2), K("industrial", 2),
            // English — weak
            K("market", 1), K("markets", 1), K("crore", 1), K("lakh", 1),
            K("budget", 1), K("rupee", 1), K("rupees", 1), K("factory", 1),
            // Hindi — strong
            K("शेयर", 2), K("सेंसेक्स", 2), K("निफ्टी", 2), K("बैंक", 2),
            K("व्यापार", 2), K("व्यापारी", 2), K("अर्थव्यवस्था", 2), K("महंगाई", 2),
            K("निवेश", 2), K("कंपनी", 2), K("उद्योग", 2), K("कारोबार", 2),
            K("जीएसटी", 2), K("आयात", 2), K("निर्यात", 2), K("व्यवसाय", 2),
            K("लाभ", 2), K("घाटा", 2),
            // Hindi — weak
            K("बाजार", 1), K("बाज़ार", 1), K("करोड़", 1), K("लाख", 1), K("रुपये", 1),
        ]),
        new("State",
        [
            // English — strong
            K("government", 2), K("chief minister", 2), K("minister", 2),
            K("ministers", 2), K("mla", 2), K("mlas", 2), K("assembly", 2),
            K("vidhan sabha", 2), K("cabinet", 2), K("governor", 2),
            K("state government", 2), K("legislative assembly", 2), K("opposition", 2),
            K("policy", 2), K("scheme", 2), K("schemes", 2), K("yojana", 2),
            K("bjp", 2), K("congress", 2), K("samajwadi party", 2), K("bsp", 2),
            K("legislature", 2), K("chief secretary", 2),
            // English — weak
            K("election", 1), K("elections", 1), K("politics", 1), K("political", 1),
            K("cm", 1), K("state", 1),
            // Hindi — strong
            K("सरकार", 2), K("मुख्यमंत्री", 2), K("मंत्री", 2), K("विधानसभा", 2),
            K("विधायक", 2), K("कैबिनेट", 2), K("राज्यपाल", 2), K("योजना", 2),
            K("विपक्ष", 2), K("प्रदेश", 2), K("राज्य", 2), K("शासन", 2),
            K("मुख्य सचिव", 2), K("बीजेपी", 2), K("कांग्रेस", 2), K("समाजवादी", 2),
            K("बसपा", 2),
            // Hindi — weak
            K("चुनाव", 1), K("नेता", 1), K("पार्टी", 1),
        ]),
        new("National",
        [
            // English — strong
            K("parliament", 2), K("lok sabha", 2), K("rajya sabha", 2),
            K("supreme court", 2), K("president", 2), K("prime minister", 2),
            K("union government", 2), K("central government", 2), K("national", 2),
            K("india-wide", 2), K("nationwide", 2),
            // English — weak
            K("india", 1), K("country", 1), K("nation", 1),
            // Hindi — strong
            K("संसद", 2), K("लोकसभा", 2), K("राज्यसभा", 2), K("सुप्रीम कोर्ट", 2),
            K("राष्ट्रपति", 2), K("प्रधानमंत्री", 2), K("केंद्र सरकार", 2),
            K("केंद्रीय सरकार", 2), K("राष्ट्रीय", 2),
            // Hindi — weak
            K("भारत", 1), K("देश", 1),
        ]),
        new("Local",
        [
            // English — strong
            K("municipal", 2), K("municipal corporation", 2), K("nagar nigam", 2),
            K("ward", 2), K("wards", 2), K("mayor", 2), K("councillor", 2),
            K("councillors", 2), K("councilor", 2), K("councilors", 2),
            K("civic", 2), K("municipality", 2), K("municipal council", 2),
            K("nagar palika", 2), K("nagar panchayat", 2), K("water supply", 2),
            K("sewage", 2), K("sanitation", 2), K("pothole", 2), K("potholes", 2),
            K("street light", 2), K("street lights", 2), K("smart city", 2),
            // English — weak
            K("local", 1), K("garbage", 1), K("drains", 1), K("waterlogging", 1),
            K("district", 1),
            // Hindi — strong
            K("नगर निगम", 2), K("महानगर", 2), K("वार्ड", 2), K("महापौर", 2),
            K("मेयर", 2), K("पार्षद", 2), K("नगरायुक्त", 2), K("पालिका", 2),
            K("नगर पंचायत", 2), K("सफाई", 2), K("गटर", 2), K("नाली", 2),
            K("पेयजल", 2), K("जल भराव", 2), K("सीवर", 2), K("निगम", 2),
            // Hindi — weak
            K("नगर", 1), K("कूड़ा", 1), K("मोहल्ला", 1), K("थाना", 1),
        ]),
    ];

    /// <summary>
    /// Scores headline + summary against every known category and returns the
    /// winner when evidence clears the minimum score and a clear-margin
    /// confidence bar; otherwise null (caller keeps the stored category).
    /// </summary>
    public static ContentCategoryMatch? Classify(string? headline, string? summary)
    {
        if (string.IsNullOrWhiteSpace(headline) && string.IsNullOrWhiteSpace(summary))
        {
            return null;
        }

        var head = headline ?? string.Empty;
        var body = summary ?? string.Empty;

        double top = 0;
        double second = 0;
        string? topCategory = null;

        foreach (var rules in RuleSets)
        {
            var score = 0d;
            foreach (var keyword in rules.Keywords)
            {
                if (keyword.Matches(head))
                {
                    score += keyword.Weight * HeadlineMultiplier;
                }
                else if (keyword.Matches(body))
                {
                    score += keyword.Weight;
                }
            }

            if (score > top)
            {
                second = top;
                top = score;
                topCategory = rules.Category;
            }
            else if (score > second)
            {
                second = score;
            }
        }

        if (topCategory is null || top < MinScore)
        {
            return null;
        }

        var confidence = top / (top + second);
        return confidence >= MinConfidence
            ? new ContentCategoryMatch(topCategory, confidence)
            : null;
    }

    /// <summary>
    /// Content-analyzed category when confident, else the stored ingest category.
    /// Used for feed sectioning and for aligning affinity keys with section keys.
    /// </summary>
    public static string EffectiveCategory(string storedCategory, string? headline, string? summary) =>
        Classify(headline, summary)?.Category ?? storedCategory;

    private static Keyword K(string term, double weight) => new(term, weight);

    private sealed record CategoryRules(string Category, IReadOnlyList<Keyword> Keywords);

    private sealed record Keyword
    {
        private readonly string _term;
        private readonly Regex? _regex;

        public Keyword(string term, double weight)
        {
            _term = term;
            Weight = weight;
            // ASCII terms match on word boundaries so "cm" never hits "cm²" inside
            // words and "match" never hits "matching"; Devanagari terms match as
            // substrings (Hindi compounds make boundary matching unreliable).
            if (term.All(char.IsAscii))
            {
                _regex = new Regex(
                    $"\\b{Regex.Escape(term)}\\b",
                    RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);
            }
        }

        public double Weight { get; }

        public bool Matches(string text) =>
            text.Length > 0
            && (_regex is not null
                ? _regex.IsMatch(text)
                : text.Contains(_term, StringComparison.Ordinal));
    }
}
