using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NewsFeed.Api.Migrations
{
    /// <inheritdoc />
    public partial class ExpandLocalNewsSourceCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "sources",
                columns: new[] { "id", "city_id", "feed_url", "is_active", "kind", "language", "last_error_message", "last_fetch_status", "last_fetched_at", "name", "scrape_config", "type" },
                values: new object[,]
                {
                    { 21, 1, "https://timesofindia.indiatimes.com/city/agra", true, "CityEdition", "en", null, null, null, "Times of India Agra", null, "Scrape" },
                    { 22, 5, "https://timesofindia.indiatimes.com/city/delhi", true, "CityEdition", "en", null, null, null, "Times of India Delhi", null, "Scrape" },
                    { 23, 3, "https://timesofindia.indiatimes.com/city/kanpur", true, "CityEdition", "en", null, null, null, "Times of India Kanpur", null, "Scrape" },
                    { 24, 4, "https://timesofindia.indiatimes.com/city/lucknow", true, "CityEdition", "en", null, null, null, "Times of India Lucknow", null, "Scrape" },
                    { 25, 1, "https://news.google.com/rss/search?q=Agra&hl=hi-IN&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News Agra", null, "Rss" },
                    { 26, 3, "https://news.google.com/rss/search?q=Kanpur&hl=hi-IN&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News Kanpur", null, "Rss" },
                    { 27, 4, "https://news.google.com/rss/search?q=Lucknow&hl=hi-IN&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News Lucknow", null, "Rss" },
                    { 28, 5, "https://news.google.com/rss/search?q=Delhi%20OR%20Gurugram%20OR%20Noida%20OR%20NCR&hl=hi-IN&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News Delhi NCR", null, "Rss" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 28);
        }
    }
}
