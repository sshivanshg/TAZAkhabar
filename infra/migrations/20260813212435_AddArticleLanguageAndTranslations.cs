using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace NewsFeed.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddArticleLanguageAndTranslations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "detected_language",
                table: "articles",
                type: "character varying(8)",
                maxLength: 8,
                nullable: false,
                defaultValue: "en");

            migrationBuilder.CreateTable(
                name: "article_translations",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    article_id = table.Column<int>(type: "integer", nullable: false),
                    target_language = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    translated_headline = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    translated_summary = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    translated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_article_translations", x => x.id);
                    table.ForeignKey(
                        name: "FK_article_translations_articles_article_id",
                        column: x => x.article_id,
                        principalTable: "articles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_article_translations_article_id_target_language",
                table: "article_translations",
                columns: new[] { "article_id", "target_language" },
                unique: true);



            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 1,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 2,
                column: "detected_language",
                value: "hi");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 3,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 4,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 5,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 6,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 7,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 8,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 9,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 10,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 11,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 12,
                column: "detected_language",
                value: "hi");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 13,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 14,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 15,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 16,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 17,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 18,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 19,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 20,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 21,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 22,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 23,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 24,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 25,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 26,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 27,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 28,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 29,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 30,
                column: "detected_language",
                value: "hi");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 31,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 32,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 33,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 34,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 35,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 36,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 37,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 38,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 39,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 40,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 41,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 42,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 43,
                column: "detected_language",
                value: "hi");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 44,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 45,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 46,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 47,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 48,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 49,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 50,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 51,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 52,
                column: "detected_language",
                value: "hi");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 53,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 54,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 55,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 56,
                column: "detected_language",
                value: "en");
            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 57,
                column: "detected_language",
                value: "en");

            // Prefer source.language for existing non-seed rows when available.
            migrationBuilder.Sql("""
                UPDATE articles AS a
                SET detected_language = s.language
                FROM sources AS s
                WHERE a.source_id = s.id
                  AND s.language IS NOT NULL
                  AND length(trim(s.language)) > 0;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "article_translations");

            migrationBuilder.DropColumn(
                name: "detected_language",
                table: "articles");
        }
    }
}
