using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NewsFeed.Api.Migrations
{
    /// <inheritdoc />
    public partial class EditorialWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ingested_at",
                table: "articles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_mock",
                table: "articles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "reviewed_at",
                table: "articles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "reviewed_by",
                table: "articles",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "source_id",
                table: "articles",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "status",
                table: "articles",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Published");

            migrationBuilder.CreateTable(
                name: "sources",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    feed_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    city_id = table.Column<int>(type: "integer", nullable: false),
                    type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    kind = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    language = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    last_fetched_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    last_fetch_status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    last_error_message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sources", x => x.id);
                    table.ForeignKey(
                        name: "FK_sources_cities_city_id",
                        column: x => x.city_id,
                        principalTable: "cities",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ingestion_runs",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    source_id = table.Column<int>(type: "integer", nullable: false),
                    started_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    articles_found = table.Column<int>(type: "integer", nullable: false),
                    articles_added = table.Column<int>(type: "integer", nullable: false),
                    articles_skipped = table.Column<int>(type: "integer", nullable: false),
                    articles_failed = table.Column<int>(type: "integer", nullable: false),
                    error_summary = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ingestion_runs", x => x.id);
                    table.ForeignKey(
                        name: "FK_ingestion_runs_sources_source_id",
                        column: x => x.source_id,
                        principalTable: "sources",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 1,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Local municipal budget approved for FY26", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 2,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "झांसी में गर्मी से राहत के लिए जल केंद्र खुले", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 3,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "District hospital expands OPD hours for seniors", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 4,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Inter-college cricket final draws packed stands", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 5,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Small traders seek GST help desk at market", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 6,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "State road works pause near Orchha junction", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 7,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Free eye camp scheduled at community hall", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 8,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Women runners finish charity 5K in Bundelkhand heat", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 9,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Co-operative bank opens new KCC window", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 10,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Power department clears monsoon contingency plan", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 11,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Leather cluster workshop on export compliance", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 12,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "कानपुर में नदी किनारे सफाई अभियान", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 13,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "City marathon route announced for October", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 14,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Dengue awareness drive in schools", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 15,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "State bus depot adds evening Lucknow services", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 16,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Neighborhood library extends weekend hours", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 17,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Blood donation camp at engineering campus", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 18,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Local football league resumes under lights", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 19,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "MSME help desk clarifies invoice financing", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 20,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Gomti riverside walkway lighting upgraded", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 21,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "State capital hosts digital literacy fair", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 22,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Lucknow Super Giants fan zone mock preview", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 23,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Polyclinic adds physiotherapy slots", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 24,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Handloom exhibition draws weekend crowds", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 25,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Startup clinic explains FSSAI basics for cafes", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 26,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Heat advisory tips shared for outdoor workers", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 27,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Inter-school kho-kho finals this Saturday", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 28,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "State tourism office posts monsoon itineraries", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 29,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Taj periphery traffic trial for weekends", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 30,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "आगरा में पेयजल पाइपलाइन मरम्मत", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 31,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Heritage walk guides complete first aid course", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 32,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "District athletics meet sets school records", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 33,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Leather and footwear stalls at trade fair", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 34,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "State archaeology office lists monsoon closures", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 35,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Free BP check camp near civil lines", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 36,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Night cricket nets reopen at club ground", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 37,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Hotel association briefs staff on guest safety drills", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 38,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Ward sabha discusses park fencing this evening", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 39,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Pharmacy chain starts evening home delivery trial", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 40,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Bundelkhand youth chess meet opens at town hall", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 41,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Kirana shops join digital invoice training", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 42,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "State scholarship form help desk at tehsil", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 43,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "कानपुर मेट्रो स्टेशन के पास नई बस शेल्टर", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 44,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Free sugar and BP screening at textile mill gate", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 45,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Indoor badminton courts bookable online this week", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 46,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Wholesale mandi posts new vegetable arrival timings", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 47,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "State skill centre offers free stitching course", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 48,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Lucknow traffic police trial zebra-first crossings", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 49,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Monsoon allergy clinic extends evening hours", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 50,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Women football trial day at university ground", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 51,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Chikankari cluster hosts buyer–seller meet", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 52,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "राज्य संग्रहालय में मानसून विशेष प्रदर्शनी", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 53,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Agra cantonment market gets Sunday pedestrian hour", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 54,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Free dental check-up van near railway station", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 55,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Cycle rally promotes safe helmet use", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 56,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "Guest-house owners attend fire-safety refresher", null, true, null, null, null, "Published" });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 57,
                columns: new[] { "headline", "ingested_at", "is_mock", "reviewed_at", "reviewed_by", "source_id", "status" },
                values: new object[] { "State transport adds Agra–Mathura early bus", null, true, null, null, null, "Published" });

            migrationBuilder.InsertData(
                table: "sources",
                columns: new[] { "id", "city_id", "feed_url", "is_active", "kind", "language", "last_error_message", "last_fetch_status", "last_fetched_at", "name", "type" },
                values: new object[,]
                {
                    { 1, 2, "https://www.amarujala.com/rss/jhansi.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", "Rss" },
                    { 2, 2, "https://www.amarujala.com/rss/lalitpur.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", "Rss" },
                    { 3, 2, "https://news.google.com/rss/search?q=Jhansi&hl=en-IN&gl=IN&ceid=IN:en", true, "CityEdition", "en", null, null, null, "Google News", "Rss" },
                    { 4, 2, "https://www.amarujala.com/rss/uttar-pradesh.xml", true, "Wider", "hi", null, null, null, "Amar Ujala", "Rss" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_articles_source_id",
                table: "articles",
                column: "source_id");

            migrationBuilder.CreateIndex(
                name: "IX_articles_status_city_id",
                table: "articles",
                columns: new[] { "status", "city_id" });

            migrationBuilder.CreateIndex(
                name: "IX_ingestion_runs_source_id_started_at",
                table: "ingestion_runs",
                columns: new[] { "source_id", "started_at" });

            migrationBuilder.CreateIndex(
                name: "IX_sources_city_id",
                table: "sources",
                column: "city_id");

            migrationBuilder.CreateIndex(
                name: "IX_sources_feed_url",
                table: "sources",
                column: "feed_url",
                unique: true,
                filter: "\"type\" = 'Rss' AND \"feed_url\" IS NOT NULL");

            // Backfill non-seed rows (live ingested / any leftover [MOCK] headlines).
            migrationBuilder.Sql(
                """
                UPDATE articles SET status = 'Published' WHERE status IS NULL OR status = '';
                UPDATE articles SET is_mock = TRUE WHERE headline LIKE '[MOCK]%';
                UPDATE articles SET headline = regexp_replace(headline, '^\[MOCK\]\s*', '') WHERE headline LIKE '[MOCK]%';
                """);

            migrationBuilder.AddForeignKey(
                name: "FK_articles_sources_source_id",
                table: "articles",
                column: "source_id",
                principalTable: "sources",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_articles_sources_source_id",
                table: "articles");

            migrationBuilder.DropTable(
                name: "ingestion_runs");

            migrationBuilder.DropTable(
                name: "sources");

            migrationBuilder.DropIndex(
                name: "IX_articles_source_id",
                table: "articles");

            migrationBuilder.DropIndex(
                name: "IX_articles_status_city_id",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "ingested_at",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "is_mock",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "reviewed_at",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "reviewed_by",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "source_id",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "status",
                table: "articles");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 1,
                column: "headline",
                value: "[MOCK] Local municipal budget approved for FY26");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 2,
                column: "headline",
                value: "[MOCK] झांसी में गर्मी से राहत के लिए जल केंद्र खुले");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 3,
                column: "headline",
                value: "[MOCK] District hospital expands OPD hours for seniors");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 4,
                column: "headline",
                value: "[MOCK] Inter-college cricket final draws packed stands");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 5,
                column: "headline",
                value: "[MOCK] Small traders seek GST help desk at market");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 6,
                column: "headline",
                value: "[MOCK] State road works pause near Orchha junction");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 7,
                column: "headline",
                value: "[MOCK] Free eye camp scheduled at community hall");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 8,
                column: "headline",
                value: "[MOCK] Women runners finish charity 5K in Bundelkhand heat");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 9,
                column: "headline",
                value: "[MOCK] Co-operative bank opens new KCC window");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 10,
                column: "headline",
                value: "[MOCK] Power department clears monsoon contingency plan");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 11,
                column: "headline",
                value: "[MOCK] Leather cluster workshop on export compliance");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 12,
                column: "headline",
                value: "[MOCK] कानपुर में नदी किनारे सफाई अभियान");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 13,
                column: "headline",
                value: "[MOCK] City marathon route announced for October");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 14,
                column: "headline",
                value: "[MOCK] Dengue awareness drive in schools");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 15,
                column: "headline",
                value: "[MOCK] State bus depot adds evening Lucknow services");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 16,
                column: "headline",
                value: "[MOCK] Neighborhood library extends weekend hours");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 17,
                column: "headline",
                value: "[MOCK] Blood donation camp at engineering campus");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 18,
                column: "headline",
                value: "[MOCK] Local football league resumes under lights");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 19,
                column: "headline",
                value: "[MOCK] MSME help desk clarifies invoice financing");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 20,
                column: "headline",
                value: "[MOCK] Gomti riverside walkway lighting upgraded");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 21,
                column: "headline",
                value: "[MOCK] State capital hosts digital literacy fair");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 22,
                column: "headline",
                value: "[MOCK] Lucknow Super Giants fan zone mock preview");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 23,
                column: "headline",
                value: "[MOCK] Polyclinic adds physiotherapy slots");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 24,
                column: "headline",
                value: "[MOCK] Handloom exhibition draws weekend crowds");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 25,
                column: "headline",
                value: "[MOCK] Startup clinic explains FSSAI basics for cafes");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 26,
                column: "headline",
                value: "[MOCK] Heat advisory tips shared for outdoor workers");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 27,
                column: "headline",
                value: "[MOCK] Inter-school kho-kho finals this Saturday");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 28,
                column: "headline",
                value: "[MOCK] State tourism office posts monsoon itineraries");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 29,
                column: "headline",
                value: "[MOCK] Taj periphery traffic trial for weekends");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 30,
                column: "headline",
                value: "[MOCK] आगरा में पेयजल पाइपलाइन मरम्मत");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 31,
                column: "headline",
                value: "[MOCK] Heritage walk guides complete first aid course");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 32,
                column: "headline",
                value: "[MOCK] District athletics meet sets school records");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 33,
                column: "headline",
                value: "[MOCK] Leather and footwear stalls at trade fair");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 34,
                column: "headline",
                value: "[MOCK] State archaeology office lists monsoon closures");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 35,
                column: "headline",
                value: "[MOCK] Free BP check camp near civil lines");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 36,
                column: "headline",
                value: "[MOCK] Night cricket nets reopen at club ground");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 37,
                column: "headline",
                value: "[MOCK] Hotel association briefs staff on guest safety drills");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 38,
                column: "headline",
                value: "[MOCK] Ward sabha discusses park fencing this evening");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 39,
                column: "headline",
                value: "[MOCK] Pharmacy chain starts evening home delivery trial");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 40,
                column: "headline",
                value: "[MOCK] Bundelkhand youth chess meet opens at town hall");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 41,
                column: "headline",
                value: "[MOCK] Kirana shops join digital invoice training");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 42,
                column: "headline",
                value: "[MOCK] State scholarship form help desk at tehsil");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 43,
                column: "headline",
                value: "[MOCK] कानपुर मेट्रो स्टेशन के पास नई बस शेल्टर");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 44,
                column: "headline",
                value: "[MOCK] Free sugar and BP screening at textile mill gate");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 45,
                column: "headline",
                value: "[MOCK] Indoor badminton courts bookable online this week");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 46,
                column: "headline",
                value: "[MOCK] Wholesale mandi posts new vegetable arrival timings");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 47,
                column: "headline",
                value: "[MOCK] State skill centre offers free stitching course");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 48,
                column: "headline",
                value: "[MOCK] Lucknow traffic police trial zebra-first crossings");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 49,
                column: "headline",
                value: "[MOCK] Monsoon allergy clinic extends evening hours");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 50,
                column: "headline",
                value: "[MOCK] Women football trial day at university ground");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 51,
                column: "headline",
                value: "[MOCK] Chikankari cluster hosts buyer–seller meet");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 52,
                column: "headline",
                value: "[MOCK] राज्य संग्रहालय में मानसून विशेष प्रदर्शनी");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 53,
                column: "headline",
                value: "[MOCK] Agra cantonment market gets Sunday pedestrian hour");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 54,
                column: "headline",
                value: "[MOCK] Free dental check-up van near railway station");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 55,
                column: "headline",
                value: "[MOCK] Cycle rally promotes safe helmet use");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 56,
                column: "headline",
                value: "[MOCK] Guest-house owners attend fire-safety refresher");

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 57,
                column: "headline",
                value: "[MOCK] State transport adds Agra–Mathura early bus");
        }
    }
}
