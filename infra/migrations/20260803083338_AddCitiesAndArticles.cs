using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NewsFeed.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCitiesAndArticles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "cities",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    state = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    slug = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cities", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "articles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    city_id = table.Column<int>(type: "integer", nullable: false),
                    headline = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    summary = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    source_name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    source_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    published_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    category = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    image_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_articles", x => x.id);
                    table.ForeignKey(
                        name: "FK_articles_cities_city_id",
                        column: x => x.city_id,
                        principalTable: "cities",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "cities",
                columns: new[] { "id", "name", "slug", "state" },
                values: new object[,]
                {
                    { 1, "Agra", "agra", "Uttar Pradesh" },
                    { 2, "Jhansi", "jhansi", "Uttar Pradesh" },
                    { 3, "Kanpur", "kanpur", "Uttar Pradesh" },
                    { 4, "Lucknow", "lucknow", "Uttar Pradesh" }
                });

            migrationBuilder.InsertData(
                table: "articles",
                columns: new[] { "id", "category", "city_id", "headline", "image_url", "published_at", "source_name", "source_url", "summary" },
                values: new object[,]
                {
                    { 1, "Local", 2, "[MOCK] Local municipal budget approved for FY26", "https://picsum.photos/seed/jhansi1/640/360", new DateTimeOffset(new DateTime(2026, 8, 1, 6, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Dainik Jagran", "https://example.com/mock/1", "The Jhansi Municipal Corporation cleared the annual budget in a special session. Funds prioritize water supply repairs and street lighting in older wards." },
                    { 2, "Local", 2, "[MOCK] झांसी में गर्मी से राहत के लिए जल केंद्र खुले", null, new DateTimeOffset(new DateTime(2026, 8, 1, 3, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Amar Ujala", "https://example.com/mock/2", "नगर निगम ने मुख्य चौराहों पर अस्थायी जल वितरण केंद्र शुरू किए। स्वयंसेवक सुबह और शाम पाली में ड्यूटी पर हैं।" },
                    { 3, "Health", 2, "[MOCK] District hospital expands OPD hours for seniors", "https://picsum.photos/seed/jhansi2/640/360", new DateTimeOffset(new DateTime(2026, 8, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Hindustan", "https://example.com/mock/3", "New evening OPD slots aim to cut wait times for patients over 60. Officials say walk-in registration will open at 4 pm on weekdays." },
                    { 4, "Sports", 2, "[MOCK] Inter-college cricket final draws packed stands", null, new DateTimeOffset(new DateTime(2026, 7, 31, 20, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Sports Express Mock", "https://example.com/mock/4", "Rani Lakshmibai College beat City College by 42 runs in the district final. Organizers thanked volunteers for crowd management." },
                    { 5, "Business", 2, "[MOCK] Small traders seek GST help desk at market", "https://picsum.photos/seed/jhansi3/640/360", new DateTimeOffset(new DateTime(2026, 7, 31, 14, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Business Line Mock", "https://example.com/mock/5", "Cloth market association asked for a weekly help desk for filing queries. The commercial tax office said a pilot desk may start next month." },
                    { 6, "State", 2, "[MOCK] State road works pause near Orchha junction", null, new DateTimeOffset(new DateTime(2026, 7, 31, 8, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "UP News Desk Mock", "https://example.com/mock/6", "PWD paused overnight resurfacing after monsoon forecasts. Diversions remain in place for heavy vehicles through the weekend." },
                    { 7, "Health", 2, "[MOCK] Free eye camp scheduled at community hall", "https://picsum.photos/seed/jhansi4/640/360", new DateTimeOffset(new DateTime(2026, 7, 31, 2, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Health Today Mock", "https://example.com/mock/7", "Local NGO and district health team will screen cataracts this Sunday. Appointments are not required; bring an ID card if available." },
                    { 8, "Sports", 2, "[MOCK] Women runners finish charity 5K in Bundelkhand heat", null, new DateTimeOffset(new DateTime(2026, 7, 30, 20, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Sports Express Mock", "https://example.com/mock/8", "Over 200 participants completed the morning route from the fort gate. Proceeds go to a neighborhood literacy fund." },
                    { 9, "Business", 2, "[MOCK] Co-operative bank opens new KCC window", "https://picsum.photos/seed/jhansi5/640/360", new DateTimeOffset(new DateTime(2026, 7, 30, 14, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Business Line Mock", "https://example.com/mock/9", "Farmers can apply for Kisan Credit Card renewals without prior appointment this fortnight. Branch hours extend to 6 pm on Fridays." },
                    { 10, "State", 2, "[MOCK] Power department clears monsoon contingency plan", null, new DateTimeOffset(new DateTime(2026, 7, 30, 8, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "UP News Desk Mock", "https://example.com/mock/10", "Emergency crews and spare transformers are staged for Bundelkhand districts. Hotline numbers will be published on ward notice boards." },
                    { 11, "Business", 3, "[MOCK] Leather cluster workshop on export compliance", "https://picsum.photos/seed/kanpur1/640/360", new DateTimeOffset(new DateTime(2026, 8, 1, 5, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Business Line Mock", "https://example.com/mock/11", "Industry body hosted a half-day session on documentation for small exporters. Speakers stressed early GST reconciliation before shipments." },
                    { 12, "Local", 3, "[MOCK] कानपुर में नदी किनारे सफाई अभियान", null, new DateTimeOffset(new DateTime(2026, 8, 1, 2, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Dainik Jagran", "https://example.com/mock/12", "स्थानीय युवा समूह ने घाट क्षेत्र की सफाई की। नगर निगम ने अतिरिक्त कचरा वाहन उपलब्ध कराए।" },
                    { 13, "Sports", 3, "[MOCK] City marathon route announced for October", "https://picsum.photos/seed/kanpur2/640/360", new DateTimeOffset(new DateTime(2026, 7, 31, 22, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Sports Express Mock", "https://example.com/mock/13", "The 10K loop will avoid peak market streets before 8 am. Registration opens online next week with senior citizen discounts." },
                    { 14, "Health", 3, "[MOCK] Dengue awareness drive in schools", null, new DateTimeOffset(new DateTime(2026, 7, 31, 18, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Hindustan", "https://example.com/mock/14", "Health workers demonstrated larvicide use and home checks. Parents received printed checklists in Hindi and English." },
                    { 15, "State", 3, "[MOCK] State bus depot adds evening Lucknow services", "https://picsum.photos/seed/kanpur3/640/360", new DateTimeOffset(new DateTime(2026, 7, 31, 12, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "UP News Desk Mock", "https://example.com/mock/15", "Two extra AC buses will run after 7 pm on weekdays. Tickets can be booked at the counter or via the state portal." },
                    { 16, "Local", 3, "[MOCK] Neighborhood library extends weekend hours", null, new DateTimeOffset(new DateTime(2026, 7, 31, 4, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Amar Ujala", "https://example.com/mock/16", "Reading room stays open until 8 pm on Saturdays. Volunteers will help first-time users find newspapers and magazines." },
                    { 17, "Health", 3, "[MOCK] Blood donation camp at engineering campus", "https://picsum.photos/seed/kanpur4/640/360", new DateTimeOffset(new DateTime(2026, 7, 30, 22, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Health Today Mock", "https://example.com/mock/17", "District blood bank partnered with student clubs for a one-day drive. Walk-ins welcome after a brief health screening." },
                    { 18, "Sports", 3, "[MOCK] Local football league resumes under lights", null, new DateTimeOffset(new DateTime(2026, 7, 30, 16, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Sports Express Mock", "https://example.com/mock/18", "Floodlit matches return after pitch repairs. Season fixtures will be posted at the municipal sports office." },
                    { 19, "Business", 3, "[MOCK] MSME help desk clarifies invoice financing", "https://picsum.photos/seed/kanpur5/640/360", new DateTimeOffset(new DateTime(2026, 7, 30, 10, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Business Line Mock", "https://example.com/mock/19", "Bankers answered questions on working-capital products for workshops. Follow-up clinics are planned monthly." },
                    { 20, "Local", 4, "[MOCK] Gomti riverside walkway lighting upgraded", "https://picsum.photos/seed/lucknow1/640/360", new DateTimeOffset(new DateTime(2026, 8, 1, 7, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Dainik Jagran", "https://example.com/mock/20", "New LED fixtures cover the popular evening stretch. Civic teams asked residents to report dark spots via the ward app." },
                    { 21, "State", 4, "[MOCK] State capital hosts digital literacy fair", null, new DateTimeOffset(new DateTime(2026, 8, 1, 4, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "UP News Desk Mock", "https://example.com/mock/21", "Seniors practiced video calls and UPI basics at free booths. Sessions run through the weekend at the exhibition ground." },
                    { 22, "Sports", 4, "[MOCK] Lucknow Super Giants fan zone mock preview", "https://picsum.photos/seed/lucknow2/640/360", new DateTimeOffset(new DateTime(2026, 7, 31, 23, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Sports Express Mock", "https://example.com/mock/22", "A temporary fan zone mock setup tested crowd flow near the stadium. Organizers say real match-day plans will differ." },
                    { 23, "Health", 4, "[MOCK] Polyclinic adds physiotherapy slots", null, new DateTimeOffset(new DateTime(2026, 7, 31, 17, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Hindustan", "https://example.com/mock/23", "Morning physiotherapy appointments open for joint pain cases. Doctors advise early booking for monsoon-related flare-ups." },
                    { 24, "Local", 4, "[MOCK] Handloom exhibition draws weekend crowds", "https://picsum.photos/seed/lucknow3/640/360", new DateTimeOffset(new DateTime(2026, 7, 31, 10, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Amar Ujala", "https://example.com/mock/24", "Artisans from nearby districts displayed chikankari and cotton weaves. Organizers capped entry to keep aisles walkable." },
                    { 25, "Business", 4, "[MOCK] Startup clinic explains FSSAI basics for cafes", null, new DateTimeOffset(new DateTime(2026, 7, 31, 5, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Business Line Mock", "https://example.com/mock/25", "Food entrepreneurs attended a free morning clinic. Mentors walked through labeling and kitchen checklist requirements." },
                    { 26, "Health", 4, "[MOCK] Heat advisory tips shared for outdoor workers", "https://picsum.photos/seed/lucknow4/640/360", new DateTimeOffset(new DateTime(2026, 7, 30, 23, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Health Today Mock", "https://example.com/mock/26", "Health department posted rest-and-water guidance for construction crews. NGOs will distribute ORS packets at major sites." },
                    { 27, "Sports", 4, "[MOCK] Inter-school kho-kho finals this Saturday", null, new DateTimeOffset(new DateTime(2026, 7, 30, 17, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Sports Express Mock", "https://example.com/mock/27", "Eight teams remain in the city championship. Matches begin at 7 am at the university ground." },
                    { 28, "State", 4, "[MOCK] State tourism office posts monsoon itineraries", "https://picsum.photos/seed/lucknow5/640/360", new DateTimeOffset(new DateTime(2026, 7, 30, 11, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "UP News Desk Mock", "https://example.com/mock/28", "Suggested day trips highlight museums and indoor heritage sites. Officials caution against unverified riverside picnic spots." },
                    { 29, "Local", 1, "[MOCK] Taj periphery traffic trial for weekends", "https://picsum.photos/seed/agra1/640/360", new DateTimeOffset(new DateTime(2026, 8, 1, 6, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Dainik Jagran", "https://example.com/mock/29", "Police will test one-way loops near popular photo points. Signage goes up Friday evening; feedback desks at two junctions." },
                    { 30, "Local", 1, "[MOCK] आगरा में पेयजल पाइपलाइन मरम्मत", null, new DateTimeOffset(new DateTime(2026, 8, 1, 1, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Amar Ujala", "https://example.com/mock/30", "जल संस्थान की टीम ने पुरानी लाइन बदलने का काम शुरू किया। प्रभावित कॉलोनियों में टैंकर सेवा अस्थायी रूप से बढ़ाई गई।" },
                    { 31, "Health", 1, "[MOCK] Heritage walk guides complete first aid course", "https://picsum.photos/seed/agra2/640/360", new DateTimeOffset(new DateTime(2026, 7, 31, 21, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Health Today Mock", "https://example.com/mock/31", "Tour guides finished a weekend module on heat illness and crowd injuries. Certificates were issued by a local Red Cross unit." },
                    { 32, "Sports", 1, "[MOCK] District athletics meet sets school records", null, new DateTimeOffset(new DateTime(2026, 7, 31, 16, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Sports Express Mock", "https://example.com/mock/32", "Two under-16 runners broke long-standing 100m marks. Coaches credited early-morning practice in cooler weather." },
                    { 33, "Business", 1, "[MOCK] Leather and footwear stalls at trade fair", "https://picsum.photos/seed/agra3/640/360", new DateTimeOffset(new DateTime(2026, 7, 31, 11, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Business Line Mock", "https://example.com/mock/33", "Local makers showed sample batches for domestic buyers. A help desk explained packaging standards for online sellers." },
                    { 34, "State", 1, "[MOCK] State archaeology office lists monsoon closures", null, new DateTimeOffset(new DateTime(2026, 7, 31, 6, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "UP News Desk Mock", "https://example.com/mock/34", "Some outdoor monument sections may close during heavy rain. Visitors should check the notice board before climbing steps." },
                    { 35, "Health", 1, "[MOCK] Free BP check camp near civil lines", "https://picsum.photos/seed/agra4/640/360", new DateTimeOffset(new DateTime(2026, 7, 31, 1, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Hindustan", "https://example.com/mock/35", "Pharmacists and ASHA workers will screen adults on Sunday morning. Results cards include diet tips in simple Hindi." },
                    { 36, "Sports", 1, "[MOCK] Night cricket nets reopen at club ground", null, new DateTimeOffset(new DateTime(2026, 7, 30, 19, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Sports Express Mock", "https://example.com/mock/36", "Floodlights are back after wiring repairs. Members can book 45-minute slots via the club notice board." },
                    { 37, "Business", 1, "[MOCK] Hotel association briefs staff on guest safety drills", "https://picsum.photos/seed/agra5/640/360", new DateTimeOffset(new DateTime(2026, 7, 30, 12, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Business Line Mock", "https://example.com/mock/37", "Managers reviewed evacuation and first-response steps. A city fire officer answered questions after the presentation." }
                });

            migrationBuilder.CreateIndex(
                name: "IX_articles_city_id_published_at",
                table: "articles",
                columns: new[] { "city_id", "published_at" });

            migrationBuilder.CreateIndex(
                name: "IX_cities_slug",
                table: "cities",
                column: "slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "articles");

            migrationBuilder.DropTable(
                name: "cities");
        }
    }
}
