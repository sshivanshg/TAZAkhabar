using Microsoft.EntityFrameworkCore.Migrations;
using NewsFeed.Api.Data;

#nullable disable

namespace TazaKhabar.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNationalPublisherSources : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Supersede Jhansi-only The Print pilot (2311-2312) if present.
            migrationBuilder.Sql("DELETE FROM sources WHERE id IN (2311, 2312);");

            foreach (var source in NationalPublisherSourceCatalog.Sources)
            {
                migrationBuilder.InsertData(
                    table: "sources",
                    columns: new[]
                    {
                        "id", "city_id", "feed_url", "is_active", "kind", "language",
                        "last_error_message", "last_fetch_status", "last_fetched_at", "name", "scrape_config", "type",
                    },
                    values: new object[]
                    {
                        source.Id,
                        source.CityId,
                        source.FeedUrl,
                        true,
                        source.Kind.ToString(),
                        source.Language,
                        null,
                        null,
                        null,
                        source.Name,
                        null,
                        source.Type.ToString(),
                    });
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach (var source in NationalPublisherSourceCatalog.Sources)
            {
                migrationBuilder.DeleteData(
                    table: "sources",
                    keyColumn: "id",
                    keyValue: source.Id);
            }
        }
    }
}
