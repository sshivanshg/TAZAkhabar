using NewsFeed.Api.Data.Entities;

namespace NewsFeed.Api.Data;

/// <summary>
/// Shared seed rows for EF HasData and test factories.
/// Seed articles are editorial mocks (`IsMock=true`); headlines have no `[MOCK]` prefix.
/// </summary>
public static class SeedData
{
    public static readonly City[] Cities =
    [
        new() { Id = 1, Name = "Agra", State = "Uttar Pradesh", Slug = "agra" },
        new() { Id = 2, Name = "Jhansi", State = "Uttar Pradesh", Slug = "jhansi" },
        new() { Id = 3, Name = "Kanpur", State = "Uttar Pradesh", Slug = "kanpur" },
        new() { Id = 4, Name = "Lucknow", State = "Uttar Pradesh", Slug = "lucknow" },
    ];

    /// <summary>City with no articles — used only in integration tests for empty-feed cases.</summary>
    public static readonly City EmptyTestCity = new()
    {
        Id = 99,
        Name = "Emptyville",
        State = "Test State",
        Slug = "emptyville",
    };

    public static readonly Source[] Sources =
    [
        new()
        {
            Id = 1,
            Name = "Amar Ujala",
            FeedUrl = "https://www.amarujala.com/rss/jhansi.xml",
            CityId = 2,
            Type = SourceType.Rss,
            Kind = SourceKind.CityEdition,
            Language = "hi",
            IsActive = true,
        },
        new()
        {
            Id = 2,
            Name = "Amar Ujala",
            FeedUrl = "https://www.amarujala.com/rss/lalitpur.xml",
            CityId = 2,
            Type = SourceType.Rss,
            Kind = SourceKind.CityEdition,
            Language = "hi",
            IsActive = true,
        },
        new()
        {
            Id = 3,
            Name = "Google News",
            FeedUrl = "https://news.google.com/rss/search?q=Jhansi&hl=en-IN&gl=IN&ceid=IN:en",
            CityId = 2,
            Type = SourceType.Rss,
            Kind = SourceKind.CityEdition,
            Language = "en",
            IsActive = true,
        },
        new()
        {
            Id = 4,
            Name = "Amar Ujala",
            FeedUrl = "https://www.amarujala.com/rss/uttar-pradesh.xml",
            CityId = 2,
            Type = SourceType.Rss,
            Kind = SourceKind.Wider,
            Language = "hi",
            IsActive = true,
        },
        new()
        {
            Id = 5,
            Name = "PDF uploads",
            FeedUrl = null,
            CityId = 2,
            Type = SourceType.PdfUpload,
            Kind = SourceKind.CityEdition,
            Language = "hi",
            IsActive = false,
        },
        new()
        {
            Id = 6,
            Name = "PDF uploads",
            FeedUrl = null,
            CityId = 3,
            Type = SourceType.PdfUpload,
            Kind = SourceKind.CityEdition,
            Language = "hi",
            IsActive = false,
        },
        new()
        {
            Id = 7,
            Name = "PDF uploads",
            FeedUrl = null,
            CityId = 4,
            Type = SourceType.PdfUpload,
            Kind = SourceKind.CityEdition,
            Language = "hi",
            IsActive = false,
        },
    ];

    public static readonly Article[] Articles = BuildArticles();

    private static Article[] BuildArticles()
    {
        var baseTime = new DateTimeOffset(2026, 8, 1, 8, 0, 0, TimeSpan.Zero);
        var list = new List<Article>();
        var id = 1;

        void Add(
            int cityId,
            string headline,
            string summary,
            string sourceName,
            string category,
            int hoursAgo,
            string? imageUrl)
        {
            list.Add(new Article
            {
                Id = id++,
                CityId = cityId,
                Headline = StripMockPrefix(headline),
                Summary = summary,
                SourceName = sourceName,
                SourceUrl = $"https://example.com/mock/{id - 1}",
                PublishedAt = baseTime.AddHours(-hoursAgo),
                Category = category,
                ImageUrl = imageUrl,
                Status = ArticleStatus.Published,
                IsMock = true,
            });
        }

        // Jhansi (city 2) — 10 articles
        Add(2, "[MOCK] Local municipal budget approved for FY26",
            "The Jhansi Municipal Corporation cleared the annual budget in a special session. Funds prioritize water supply repairs and street lighting in older wards.",
            "Dainik Jagran", "Local", 2, "https://picsum.photos/seed/jhansi1/640/360");
        Add(2, "[MOCK] झांसी में गर्मी से राहत के लिए जल केंद्र खुले",
            "नगर निगम ने मुख्य चौराहों पर अस्थायी जल वितरण केंद्र शुरू किए। स्वयंसेवक सुबह और शाम पाली में ड्यूटी पर हैं।",
            "Amar Ujala", "Local", 5, null);
        Add(2, "[MOCK] District hospital expands OPD hours for seniors",
            "New evening OPD slots aim to cut wait times for patients over 60. Officials say walk-in registration will open at 4 pm on weekdays.",
            "Hindustan", "Health", 8, "https://picsum.photos/seed/jhansi2/640/360");
        Add(2, "[MOCK] Inter-college cricket final draws packed stands",
            "Rani Lakshmibai College beat City College by 42 runs in the district final. Organizers thanked volunteers for crowd management.",
            "Sports Express Mock", "Sports", 12, null);
        Add(2, "[MOCK] Small traders seek GST help desk at market",
            "Cloth market association asked for a weekly help desk for filing queries. The commercial tax office said a pilot desk may start next month.",
            "Business Line Mock", "Business", 18, "https://picsum.photos/seed/jhansi3/640/360");
        Add(2, "[MOCK] State road works pause near Orchha junction",
            "PWD paused overnight resurfacing after monsoon forecasts. Diversions remain in place for heavy vehicles through the weekend.",
            "UP News Desk Mock", "State", 24, null);
        Add(2, "[MOCK] Free eye camp scheduled at community hall",
            "Local NGO and district health team will screen cataracts this Sunday. Appointments are not required; bring an ID card if available.",
            "Health Today Mock", "Health", 30, "https://picsum.photos/seed/jhansi4/640/360");
        Add(2, "[MOCK] Women runners finish charity 5K in Bundelkhand heat",
            "Over 200 participants completed the morning route from the fort gate. Proceeds go to a neighborhood literacy fund.",
            "Sports Express Mock", "Sports", 36, null);
        Add(2, "[MOCK] Co-operative bank opens new KCC window",
            "Farmers can apply for Kisan Credit Card renewals without prior appointment this fortnight. Branch hours extend to 6 pm on Fridays.",
            "Business Line Mock", "Business", 42, "https://picsum.photos/seed/jhansi5/640/360");
        Add(2, "[MOCK] Power department clears monsoon contingency plan",
            "Emergency crews and spare transformers are staged for Bundelkhand districts. Hotline numbers will be published on ward notice boards.",
            "UP News Desk Mock", "State", 48, null);

        // Kanpur (city 3) — 9 articles
        Add(3, "[MOCK] Leather cluster workshop on export compliance",
            "Industry body hosted a half-day session on documentation for small exporters. Speakers stressed early GST reconciliation before shipments.",
            "Business Line Mock", "Business", 3, "https://picsum.photos/seed/kanpur1/640/360");
        Add(3, "[MOCK] कानपुर में नदी किनारे सफाई अभियान",
            "स्थानीय युवा समूह ने घाट क्षेत्र की सफाई की। नगर निगम ने अतिरिक्त कचरा वाहन उपलब्ध कराए।",
            "Dainik Jagran", "Local", 6, null);
        Add(3, "[MOCK] City marathon route announced for October",
            "The 10K loop will avoid peak market streets before 8 am. Registration opens online next week with senior citizen discounts.",
            "Sports Express Mock", "Sports", 10, "https://picsum.photos/seed/kanpur2/640/360");
        Add(3, "[MOCK] Dengue awareness drive in schools",
            "Health workers demonstrated larvicide use and home checks. Parents received printed checklists in Hindi and English.",
            "Hindustan", "Health", 14, null);
        Add(3, "[MOCK] State bus depot adds evening Lucknow services",
            "Two extra AC buses will run after 7 pm on weekdays. Tickets can be booked at the counter or via the state portal.",
            "UP News Desk Mock", "State", 20, "https://picsum.photos/seed/kanpur3/640/360");
        Add(3, "[MOCK] Neighborhood library extends weekend hours",
            "Reading room stays open until 8 pm on Saturdays. Volunteers will help first-time users find newspapers and magazines.",
            "Amar Ujala", "Local", 28, null);
        Add(3, "[MOCK] Blood donation camp at engineering campus",
            "District blood bank partnered with student clubs for a one-day drive. Walk-ins welcome after a brief health screening.",
            "Health Today Mock", "Health", 34, "https://picsum.photos/seed/kanpur4/640/360");
        Add(3, "[MOCK] Local football league resumes under lights",
            "Floodlit matches return after pitch repairs. Season fixtures will be posted at the municipal sports office.",
            "Sports Express Mock", "Sports", 40, null);
        Add(3, "[MOCK] MSME help desk clarifies invoice financing",
            "Bankers answered questions on working-capital products for workshops. Follow-up clinics are planned monthly.",
            "Business Line Mock", "Business", 46, "https://picsum.photos/seed/kanpur5/640/360");

        // Lucknow (city 4) — 9 articles
        Add(4, "[MOCK] Gomti riverside walkway lighting upgraded",
            "New LED fixtures cover the popular evening stretch. Civic teams asked residents to report dark spots via the ward app.",
            "Dainik Jagran", "Local", 1, "https://picsum.photos/seed/lucknow1/640/360");
        Add(4, "[MOCK] State capital hosts digital literacy fair",
            "Seniors practiced video calls and UPI basics at free booths. Sessions run through the weekend at the exhibition ground.",
            "UP News Desk Mock", "State", 4, null);
        Add(4, "[MOCK] Lucknow Super Giants fan zone mock preview",
            "A temporary fan zone mock setup tested crowd flow near the stadium. Organizers say real match-day plans will differ.",
            "Sports Express Mock", "Sports", 9, "https://picsum.photos/seed/lucknow2/640/360");
        Add(4, "[MOCK] Polyclinic adds physiotherapy slots",
            "Morning physiotherapy appointments open for joint pain cases. Doctors advise early booking for monsoon-related flare-ups.",
            "Hindustan", "Health", 15, null);
        Add(4, "[MOCK] Handloom exhibition draws weekend crowds",
            "Artisans from nearby districts displayed chikankari and cotton weaves. Organizers capped entry to keep aisles walkable.",
            "Amar Ujala", "Local", 22, "https://picsum.photos/seed/lucknow3/640/360");
        Add(4, "[MOCK] Startup clinic explains FSSAI basics for cafes",
            "Food entrepreneurs attended a free morning clinic. Mentors walked through labeling and kitchen checklist requirements.",
            "Business Line Mock", "Business", 27, null);
        Add(4, "[MOCK] Heat advisory tips shared for outdoor workers",
            "Health department posted rest-and-water guidance for construction crews. NGOs will distribute ORS packets at major sites.",
            "Health Today Mock", "Health", 33, "https://picsum.photos/seed/lucknow4/640/360");
        Add(4, "[MOCK] Inter-school kho-kho finals this Saturday",
            "Eight teams remain in the city championship. Matches begin at 7 am at the university ground.",
            "Sports Express Mock", "Sports", 39, null);
        Add(4, "[MOCK] State tourism office posts monsoon itineraries",
            "Suggested day trips highlight museums and indoor heritage sites. Officials caution against unverified riverside picnic spots.",
            "UP News Desk Mock", "State", 45, "https://picsum.photos/seed/lucknow5/640/360");

        // Agra (city 1) — 9 articles
        Add(1, "[MOCK] Taj periphery traffic trial for weekends",
            "Police will test one-way loops near popular photo points. Signage goes up Friday evening; feedback desks at two junctions.",
            "Dainik Jagran", "Local", 2, "https://picsum.photos/seed/agra1/640/360");
        Add(1, "[MOCK] आगरा में पेयजल पाइपलाइन मरम्मत",
            "जल संस्थान की टीम ने पुरानी लाइन बदलने का काम शुरू किया। प्रभावित कॉलोनियों में टैंकर सेवा अस्थायी रूप से बढ़ाई गई।",
            "Amar Ujala", "Local", 7, null);
        Add(1, "[MOCK] Heritage walk guides complete first aid course",
            "Tour guides finished a weekend module on heat illness and crowd injuries. Certificates were issued by a local Red Cross unit.",
            "Health Today Mock", "Health", 11, "https://picsum.photos/seed/agra2/640/360");
        Add(1, "[MOCK] District athletics meet sets school records",
            "Two under-16 runners broke long-standing 100m marks. Coaches credited early-morning practice in cooler weather.",
            "Sports Express Mock", "Sports", 16, null);
        Add(1, "[MOCK] Leather and footwear stalls at trade fair",
            "Local makers showed sample batches for domestic buyers. A help desk explained packaging standards for online sellers.",
            "Business Line Mock", "Business", 21, "https://picsum.photos/seed/agra3/640/360");
        Add(1, "[MOCK] State archaeology office lists monsoon closures",
            "Some outdoor monument sections may close during heavy rain. Visitors should check the notice board before climbing steps.",
            "UP News Desk Mock", "State", 26, null);
        Add(1, "[MOCK] Free BP check camp near civil lines",
            "Pharmacists and ASHA workers will screen adults on Sunday morning. Results cards include diet tips in simple Hindi.",
            "Hindustan", "Health", 31, "https://picsum.photos/seed/agra4/640/360");
        Add(1, "[MOCK] Night cricket nets reopen at club ground",
            "Floodlights are back after wiring repairs. Members can book 45-minute slots via the club notice board.",
            "Sports Express Mock", "Sports", 37, null);
        Add(1, "[MOCK] Hotel association briefs staff on guest safety drills",
            "Managers reviewed evacuation and first-response steps. A city fire officer answered questions after the presentation.",
            "Business Line Mock", "Business", 44, "https://picsum.photos/seed/agra5/640/360");

        // Extra batch — fresher timestamps so feeds feel fuller when paging/filtering
        Add(2, "[MOCK] Ward sabha discusses park fencing this evening",
            "Residents can speak for three minutes each at the community centre. Agenda covers park fencing, stray cattle, and street-vendor space.",
            "Dainik Jagran", "Local", 0, "https://picsum.photos/seed/jhansi6/640/360");
        Add(2, "[MOCK] Pharmacy chain starts evening home delivery trial",
            "Selected pin codes get same-evening delivery for prescribed medicines. Call centre hours extend until 9 pm for the pilot week.",
            "Health Today Mock", "Health", 1, null);
        Add(2, "[MOCK] Bundelkhand youth chess meet opens at town hall",
            "Sixty players under 18 compete across two days. Parents can watch from the gallery; bags are checked at the entrance.",
            "Sports Express Mock", "Sports", 3, "https://picsum.photos/seed/jhansi7/640/360");
        Add(2, "[MOCK] Kirana shops join digital invoice training",
            "A free Saturday class covers QR receipts and simple stock sheets. Seats are limited; register at the market association office.",
            "Business Line Mock", "Business", 4, null);
        Add(2, "[MOCK] State scholarship form help desk at tehsil",
            "Students can get printouts and signature checks without an appointment. Bring Aadhaar and last marksheet copies.",
            "UP News Desk Mock", "State", 6, "https://picsum.photos/seed/jhansi8/640/360");

        Add(3, "[MOCK] कानपुर मेट्रो स्टेशन के पास नई बस शेल्टर",
            "परिवहन विभाग ने पैदल यात्रियों के लिए छत वाले शेल्टर जोड़े। शाम की भीड़ में सुरक्षा स्वयंसेवक तैनात रहेंगे।",
            "Amar Ujala", "Local", 0, "https://picsum.photos/seed/kanpur6/640/360");
        Add(3, "[MOCK] Free sugar and BP screening at textile mill gate",
            "Health workers will screen workers before shift change on Thursday. Results cards include diet tips in plain Hindi.",
            "Hindustan", "Health", 1, null);
        Add(3, "[MOCK] Indoor badminton courts bookable online this week",
            "Municipal sports complex opened a simple booking form for evening slots. Seniors get two free hours on weekdays.",
            "Sports Express Mock", "Sports", 3, "https://picsum.photos/seed/kanpur7/640/360");
        Add(3, "[MOCK] Wholesale mandi posts new vegetable arrival timings",
            "Traders asked buyers to arrive before 7 am for leafy greens. Parking marshals will guide two-wheelers to the side lane.",
            "Business Line Mock", "Business", 5, null);
        Add(3, "[MOCK] State skill centre offers free stitching course",
            "Eight-week batch starts Monday for women aged 18–45. Certificates are issued after attendance and a simple practical test.",
            "UP News Desk Mock", "State", 7, "https://picsum.photos/seed/kanpur8/640/360");

        Add(4, "[MOCK] Lucknow traffic police trial zebra-first crossings",
            "Marshals will pause cars for full pedestrian waves near two schools. Feedback forms are available at the junction booth.",
            "Dainik Jagran", "Local", 0, "https://picsum.photos/seed/lucknow6/640/360");
        Add(4, "[MOCK] Monsoon allergy clinic extends evening hours",
            "ENT OPD stays open until 7 pm through August. Bring previous prescriptions if you have them; walk-ins welcome.",
            "Health Today Mock", "Health", 1, null);
        Add(4, "[MOCK] Women football trial day at university ground",
            "Open trials for the city league run Saturday morning. Boots with studs are preferred; shin guards are mandatory.",
            "Sports Express Mock", "Sports", 2, "https://picsum.photos/seed/lucknow7/640/360");
        Add(4, "[MOCK] Chikankari cluster hosts buyer–seller meet",
            "Exporters and home-based artisans meet under one roof this Friday. Entry is free with a valid ID card.",
            "Business Line Mock", "Business", 4, null);
        Add(4, "[MOCK] राज्य संग्रहालय में मानसून विशेष प्रदर्शनी",
            "इतिहास और लोक कला की प्रदर्शनियाँ घर के अंदर रखी गई हैं। सप्ताहांत में बच्चों के लिए गाइडेड टूर उपलब्ध हैं।",
            "UP News Desk Mock", "State", 5, "https://picsum.photos/seed/lucknow8/640/360");

        Add(1, "[MOCK] Agra cantonment market gets Sunday pedestrian hour",
            "Cars pause from 8–9 am so families can walk the main lane. Vendors may set stalls only along marked edges.",
            "Amar Ujala", "Local", 0, "https://picsum.photos/seed/agra6/640/360");
        Add(1, "[MOCK] Free dental check-up van near railway station",
            "Dentists will screen adults and children until noon. Follow-up slips list nearby clinics for paid treatment if needed.",
            "Hindustan", "Health", 1, null);
        Add(1, "[MOCK] Cycle rally promotes safe helmet use",
            "School teams ride a 5 km loop with traffic police escorts. Free helmet fittings are available at the finish booth.",
            "Sports Express Mock", "Sports", 2, "https://picsum.photos/seed/agra7/640/360");
        Add(1, "[MOCK] Guest-house owners attend fire-safety refresher",
            "Inspectors demonstrated extinguisher use and exit drills. Certificates are valid for one year from the session date.",
            "Business Line Mock", "Business", 3, null);
        Add(1, "[MOCK] State transport adds Agra–Mathura early bus",
            "A 5:30 am service aims to help day workers. Tickets open at the depot counter from 4:45 am onwards.",
            "UP News Desk Mock", "State", 5, "https://picsum.photos/seed/agra8/640/360");

        return list.ToArray();
    }

    private static string StripMockPrefix(string headline)
    {
        if (headline.StartsWith("[MOCK] ", StringComparison.Ordinal))
        {
            return headline["[MOCK] ".Length..];
        }

        if (headline.StartsWith("[MOCK]", StringComparison.Ordinal))
        {
            return headline["[MOCK]".Length..];
        }

        return headline;
    }
}
