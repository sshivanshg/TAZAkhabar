using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewsFeed.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddArticleBody : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Idempotent: local/dev DBs may already have `body` from an earlier
            // worktree migration id (20260814045948_AddArticleBody) that is not
            // in this assembly.
            migrationBuilder.Sql(
                """
                ALTER TABLE articles ADD COLUMN IF NOT EXISTS body text;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE articles DROP COLUMN IF EXISTS body;
                """);
        }
    }
}
