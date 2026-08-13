using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewsFeed.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddImageEnrichmentAttemptedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "image_enrichment_attempted_at",
                table: "articles",
                type: "timestamp with time zone",
                nullable: true);

            // Mark all pre-existing rows as already attempted so we do not backfill history.
            migrationBuilder.Sql(
                """
                UPDATE articles
                SET image_enrichment_attempted_at = TIMESTAMPTZ '2026-08-14 00:00:00+00'
                WHERE image_enrichment_attempted_at IS NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "image_enrichment_attempted_at",
                table: "articles");
        }
    }
}
