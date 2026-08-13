using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewsFeed.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedDainikBhaskarJhansiScrape : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "sources",
                columns: new[] { "id", "city_id", "feed_url", "is_active", "kind", "language", "last_error_message", "last_fetch_status", "last_fetched_at", "name", "scrape_config", "type" },
                values: new object[] { 14, 2, "https://www.bhaskar.com/local/uttar-pradesh/jhansi/", true, "CityEdition", "hi", null, null, null, "Dainik Bhaskar", null, "Scrape" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 14);
        }
    }
}
