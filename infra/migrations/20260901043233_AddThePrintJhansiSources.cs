using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TazaKhabar.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddThePrintJhansiSources : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "sources",
                columns: new[] { "id", "city_id", "feed_url", "is_active", "kind", "language", "last_error_message", "last_fetch_status", "last_fetched_at", "name", "scrape_config", "type" },
                values: new object[,]
                {
                    { 2311, 2, "https://theprint.in/category/india/feed/", true, "Wider", "en", null, null, null, "The Print", null, "Rss" },
                    { 2312, 2, "https://news.google.com/rss/search?q=site%3Atheprint.in+Jhansi+when%3A7d&hl=en-IN&gl=IN&ceid=IN:en", true, "CityEdition", "en", null, null, null, "The Print", null, "Rss" },
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2311);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2312);
        }
    }
}
