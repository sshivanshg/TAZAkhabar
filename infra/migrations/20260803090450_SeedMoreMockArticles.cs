using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NewsFeed.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedMoreMockArticles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "articles",
                columns: new[] { "id", "category", "city_id", "headline", "image_url", "published_at", "source_name", "source_url", "summary" },
                values: new object[,]
                {
                    { 38, "Local", 2, "[MOCK] Ward sabha discusses park fencing this evening", "https://picsum.photos/seed/jhansi6/640/360", new DateTimeOffset(new DateTime(2026, 8, 1, 8, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Dainik Jagran", "https://example.com/mock/38", "Residents can speak for three minutes each at the community centre. Agenda covers park fencing, stray cattle, and street-vendor space." },
                    { 39, "Health", 2, "[MOCK] Pharmacy chain starts evening home delivery trial", null, new DateTimeOffset(new DateTime(2026, 8, 1, 7, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Health Today Mock", "https://example.com/mock/39", "Selected pin codes get same-evening delivery for prescribed medicines. Call centre hours extend until 9 pm for the pilot week." },
                    { 40, "Sports", 2, "[MOCK] Bundelkhand youth chess meet opens at town hall", "https://picsum.photos/seed/jhansi7/640/360", new DateTimeOffset(new DateTime(2026, 8, 1, 5, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Sports Express Mock", "https://example.com/mock/40", "Sixty players under 18 compete across two days. Parents can watch from the gallery; bags are checked at the entrance." },
                    { 41, "Business", 2, "[MOCK] Kirana shops join digital invoice training", null, new DateTimeOffset(new DateTime(2026, 8, 1, 4, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Business Line Mock", "https://example.com/mock/41", "A free Saturday class covers QR receipts and simple stock sheets. Seats are limited; register at the market association office." },
                    { 42, "State", 2, "[MOCK] State scholarship form help desk at tehsil", "https://picsum.photos/seed/jhansi8/640/360", new DateTimeOffset(new DateTime(2026, 8, 1, 2, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "UP News Desk Mock", "https://example.com/mock/42", "Students can get printouts and signature checks without an appointment. Bring Aadhaar and last marksheet copies." },
                    { 43, "Local", 3, "[MOCK] कानपुर मेट्रो स्टेशन के पास नई बस शेल्टर", "https://picsum.photos/seed/kanpur6/640/360", new DateTimeOffset(new DateTime(2026, 8, 1, 8, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Amar Ujala", "https://example.com/mock/43", "परिवहन विभाग ने पैदल यात्रियों के लिए छत वाले शेल्टर जोड़े। शाम की भीड़ में सुरक्षा स्वयंसेवक तैनात रहेंगे।" },
                    { 44, "Health", 3, "[MOCK] Free sugar and BP screening at textile mill gate", null, new DateTimeOffset(new DateTime(2026, 8, 1, 7, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Hindustan", "https://example.com/mock/44", "Health workers will screen workers before shift change on Thursday. Results cards include diet tips in plain Hindi." },
                    { 45, "Sports", 3, "[MOCK] Indoor badminton courts bookable online this week", "https://picsum.photos/seed/kanpur7/640/360", new DateTimeOffset(new DateTime(2026, 8, 1, 5, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Sports Express Mock", "https://example.com/mock/45", "Municipal sports complex opened a simple booking form for evening slots. Seniors get two free hours on weekdays." },
                    { 46, "Business", 3, "[MOCK] Wholesale mandi posts new vegetable arrival timings", null, new DateTimeOffset(new DateTime(2026, 8, 1, 3, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Business Line Mock", "https://example.com/mock/46", "Traders asked buyers to arrive before 7 am for leafy greens. Parking marshals will guide two-wheelers to the side lane." },
                    { 47, "State", 3, "[MOCK] State skill centre offers free stitching course", "https://picsum.photos/seed/kanpur8/640/360", new DateTimeOffset(new DateTime(2026, 8, 1, 1, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "UP News Desk Mock", "https://example.com/mock/47", "Eight-week batch starts Monday for women aged 18–45. Certificates are issued after attendance and a simple practical test." },
                    { 48, "Local", 4, "[MOCK] Lucknow traffic police trial zebra-first crossings", "https://picsum.photos/seed/lucknow6/640/360", new DateTimeOffset(new DateTime(2026, 8, 1, 8, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Dainik Jagran", "https://example.com/mock/48", "Marshals will pause cars for full pedestrian waves near two schools. Feedback forms are available at the junction booth." },
                    { 49, "Health", 4, "[MOCK] Monsoon allergy clinic extends evening hours", null, new DateTimeOffset(new DateTime(2026, 8, 1, 7, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Health Today Mock", "https://example.com/mock/49", "ENT OPD stays open until 7 pm through August. Bring previous prescriptions if you have them; walk-ins welcome." },
                    { 50, "Sports", 4, "[MOCK] Women football trial day at university ground", "https://picsum.photos/seed/lucknow7/640/360", new DateTimeOffset(new DateTime(2026, 8, 1, 6, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Sports Express Mock", "https://example.com/mock/50", "Open trials for the city league run Saturday morning. Boots with studs are preferred; shin guards are mandatory." },
                    { 51, "Business", 4, "[MOCK] Chikankari cluster hosts buyer–seller meet", null, new DateTimeOffset(new DateTime(2026, 8, 1, 4, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Business Line Mock", "https://example.com/mock/51", "Exporters and home-based artisans meet under one roof this Friday. Entry is free with a valid ID card." },
                    { 52, "State", 4, "[MOCK] राज्य संग्रहालय में मानसून विशेष प्रदर्शनी", "https://picsum.photos/seed/lucknow8/640/360", new DateTimeOffset(new DateTime(2026, 8, 1, 3, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "UP News Desk Mock", "https://example.com/mock/52", "इतिहास और लोक कला की प्रदर्शनियाँ घर के अंदर रखी गई हैं। सप्ताहांत में बच्चों के लिए गाइडेड टूर उपलब्ध हैं।" },
                    { 53, "Local", 1, "[MOCK] Agra cantonment market gets Sunday pedestrian hour", "https://picsum.photos/seed/agra6/640/360", new DateTimeOffset(new DateTime(2026, 8, 1, 8, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Amar Ujala", "https://example.com/mock/53", "Cars pause from 8–9 am so families can walk the main lane. Vendors may set stalls only along marked edges." },
                    { 54, "Health", 1, "[MOCK] Free dental check-up van near railway station", null, new DateTimeOffset(new DateTime(2026, 8, 1, 7, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Hindustan", "https://example.com/mock/54", "Dentists will screen adults and children until noon. Follow-up slips list nearby clinics for paid treatment if needed." },
                    { 55, "Sports", 1, "[MOCK] Cycle rally promotes safe helmet use", "https://picsum.photos/seed/agra7/640/360", new DateTimeOffset(new DateTime(2026, 8, 1, 6, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Sports Express Mock", "https://example.com/mock/55", "School teams ride a 5 km loop with traffic police escorts. Free helmet fittings are available at the finish booth." },
                    { 56, "Business", 1, "[MOCK] Guest-house owners attend fire-safety refresher", null, new DateTimeOffset(new DateTime(2026, 8, 1, 5, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Business Line Mock", "https://example.com/mock/56", "Inspectors demonstrated extinguisher use and exit drills. Certificates are valid for one year from the session date." },
                    { 57, "State", 1, "[MOCK] State transport adds Agra–Mathura early bus", "https://picsum.photos/seed/agra8/640/360", new DateTimeOffset(new DateTime(2026, 8, 1, 3, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "UP News Desk Mock", "https://example.com/mock/57", "A 5:30 am service aims to help day workers. Tickets open at the depot counter from 4:45 am onwards." }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "articles",
                keyColumn: "id",
                keyValue: 38);

            migrationBuilder.DeleteData(
                table: "articles",
                keyColumn: "id",
                keyValue: 39);

            migrationBuilder.DeleteData(
                table: "articles",
                keyColumn: "id",
                keyValue: 40);

            migrationBuilder.DeleteData(
                table: "articles",
                keyColumn: "id",
                keyValue: 41);

            migrationBuilder.DeleteData(
                table: "articles",
                keyColumn: "id",
                keyValue: 42);

            migrationBuilder.DeleteData(
                table: "articles",
                keyColumn: "id",
                keyValue: 43);

            migrationBuilder.DeleteData(
                table: "articles",
                keyColumn: "id",
                keyValue: 44);

            migrationBuilder.DeleteData(
                table: "articles",
                keyColumn: "id",
                keyValue: 45);

            migrationBuilder.DeleteData(
                table: "articles",
                keyColumn: "id",
                keyValue: 46);

            migrationBuilder.DeleteData(
                table: "articles",
                keyColumn: "id",
                keyValue: 47);

            migrationBuilder.DeleteData(
                table: "articles",
                keyColumn: "id",
                keyValue: 48);

            migrationBuilder.DeleteData(
                table: "articles",
                keyColumn: "id",
                keyValue: 49);

            migrationBuilder.DeleteData(
                table: "articles",
                keyColumn: "id",
                keyValue: 50);

            migrationBuilder.DeleteData(
                table: "articles",
                keyColumn: "id",
                keyValue: 51);

            migrationBuilder.DeleteData(
                table: "articles",
                keyColumn: "id",
                keyValue: 52);

            migrationBuilder.DeleteData(
                table: "articles",
                keyColumn: "id",
                keyValue: 53);

            migrationBuilder.DeleteData(
                table: "articles",
                keyColumn: "id",
                keyValue: 54);

            migrationBuilder.DeleteData(
                table: "articles",
                keyColumn: "id",
                keyValue: 55);

            migrationBuilder.DeleteData(
                table: "articles",
                keyColumn: "id",
                keyValue: 56);

            migrationBuilder.DeleteData(
                table: "articles",
                keyColumn: "id",
                keyValue: 57);
        }
    }
}
