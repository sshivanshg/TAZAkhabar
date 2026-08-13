using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewsFeed.Api.Migrations
{
    /// <inheritdoc />
    public partial class DeactivateGoogleNewsScrapeSeeds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE sources SET is_active = false WHERE type = 'Scrape' AND name = 'Google News';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE sources SET is_active = true WHERE type = 'Scrape' AND name = 'Google News';
                """);
        }
    }
}
