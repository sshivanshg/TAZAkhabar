using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NewsFeed.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedCityScrapeSources : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "sources",
                columns: new[] { "id", "city_id", "feed_url", "is_active", "kind", "language", "last_error_message", "last_fetch_status", "last_fetched_at", "name", "scrape_config", "type" },
                values: new object[,]
                {
                    { 8, 2, "https://www.amarujala.com/uttar-pradesh/jhansi", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Scrape" },
                    { 9, 2, "https://news.google.com/search?q=Jhansi&hl=hi-IN&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Scrape" },
                    { 10, 3, "https://www.amarujala.com/uttar-pradesh/kanpur", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Scrape" },
                    { 11, 3, "https://news.google.com/search?q=Kanpur&hl=hi-IN&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Scrape" },
                    { 12, 4, "https://www.amarujala.com/uttar-pradesh/lucknow", true, "CityEdition", "hi", null, null, null, "Amar Ujala", null, "Scrape" },
                    { 13, 4, "https://news.google.com/search?q=Lucknow&hl=hi-IN&gl=IN&ceid=IN:hi", true, "CityEdition", "hi", null, null, null, "Google News", null, "Scrape" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 13);
        }
    }
}
