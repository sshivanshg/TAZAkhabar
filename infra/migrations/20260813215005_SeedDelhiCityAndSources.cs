using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NewsFeed.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedDelhiCityAndSources : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "cities",
                columns: new[] { "id", "name", "slug", "state" },
                values: new object[] { 5, "Delhi", "delhi", "Delhi" });

            migrationBuilder.InsertData(
                table: "sources",
                columns: new[] { "id", "city_id", "feed_url", "is_active", "kind", "language", "last_error_message", "last_fetch_status", "last_fetched_at", "name", "scrape_config", "type" },
                values: new object[,]
                {
                    { 15, 5, "https://www.amarujala.com/rss/delhi.xml", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Rss" },
                    { 16, 5, "https://news.google.com/rss/search?q=Delhi%20OR%20Gurugram%20OR%20Noida%20OR%20NCR&hl=en-IN&gl=IN&ceid=IN:en", true, "CityEdition", "en", null, null, null, "Google News", null, "Rss" },
                    { 17, 5, null, false, "CityEdition", "hi", null, null, null, "PDF uploads", null, "PdfUpload" },
                    { 18, 5, "https://www.amarujala.com/delhi", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Scrape" },
                    { 19, 5, "https://news.google.com/search?q=Delhi%20OR%20Gurugram%20OR%20Noida&hl=hi-IN&gl=IN&ceid=IN:hi", false, "CityEdition", "hi", null, null, null, "Google News", null, "Scrape" },
                    { 20, 5, "https://www.bhaskar.com/local/new-delhi/", true, "CityEdition", "hi", null, null, null, "Dainik Bhaskar", null, "Scrape" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "cities",
                keyColumn: "id",
                keyValue: 5);
        }
    }
}
