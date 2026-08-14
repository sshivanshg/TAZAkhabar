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
            migrationBuilder.AddColumn<string>(
                name: "body",
                table: "articles",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "body",
                table: "articles");
        }
    }
}
