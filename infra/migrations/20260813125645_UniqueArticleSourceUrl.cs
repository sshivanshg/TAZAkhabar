using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewsFeed.Api.Migrations
{
    /// <inheritdoc />
    public partial class UniqueArticleSourceUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_articles_source_url",
                table: "articles",
                column: "source_url",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_articles_source_url",
                table: "articles");
        }
    }
}
