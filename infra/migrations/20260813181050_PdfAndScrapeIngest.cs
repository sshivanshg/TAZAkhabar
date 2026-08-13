using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NewsFeed.Api.Migrations
{
    /// <inheritdoc />
    public partial class PdfAndScrapeIngest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "scrape_config",
                table: "sources",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "document_upload_id",
                table: "articles",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "document_uploads",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    original_file_name = table.Column<string>(type: "character varying(260)", maxLength: 260, nullable: false),
                    stored_path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    content_type = table.Column<string>(type: "character varying(127)", maxLength: 127, nullable: false),
                    byte_size = table.Column<long>(type: "bigint", nullable: false),
                    city_hint_id = table.Column<int>(type: "integer", nullable: true),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    error_summary = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ingestion_run_id = table.Column<int>(type: "integer", nullable: true),
                    source_id = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    processed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_document_uploads", x => x.id);
                    table.ForeignKey(
                        name: "FK_document_uploads_cities_city_hint_id",
                        column: x => x.city_hint_id,
                        principalTable: "cities",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_document_uploads_ingestion_runs_ingestion_run_id",
                        column: x => x.ingestion_run_id,
                        principalTable: "ingestion_runs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_document_uploads_sources_source_id",
                        column: x => x.source_id,
                        principalTable: "sources",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 1,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 2,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 3,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 4,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 5,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 6,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 7,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 8,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 9,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 10,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 11,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 12,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 13,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 14,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 15,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 16,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 17,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 18,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 19,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 20,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 21,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 22,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 23,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 24,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 25,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 26,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 27,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 28,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 29,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 30,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 31,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 32,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 33,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 34,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 35,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 36,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 37,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 38,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 39,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 40,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 41,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 42,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 43,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 44,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 45,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 46,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 47,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 48,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 49,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 50,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 51,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 52,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 53,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 54,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 55,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 56,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "articles",
                keyColumn: "id",
                keyValue: 57,
                column: "document_upload_id",
                value: null);

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 1,
                column: "scrape_config",
                value: null);

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 2,
                column: "scrape_config",
                value: null);

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 3,
                column: "scrape_config",
                value: null);

            migrationBuilder.UpdateData(
                table: "sources",
                keyColumn: "id",
                keyValue: 4,
                column: "scrape_config",
                value: null);

            migrationBuilder.InsertData(
                table: "sources",
                columns: new[] { "id", "city_id", "feed_url", "is_active", "kind", "language", "last_error_message", "last_fetch_status", "last_fetched_at", "name", "scrape_config", "type" },
                values: new object[,]
                {
                    { 5, 2, null, false, "CityEdition", "hi", null, null, null, "PDF uploads", null, "PdfUpload" },
                    { 6, 3, null, false, "CityEdition", "hi", null, null, null, "PDF uploads", null, "PdfUpload" },
                    { 7, 4, null, false, "CityEdition", "hi", null, null, null, "PDF uploads", null, "PdfUpload" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_articles_document_upload_id",
                table: "articles",
                column: "document_upload_id");

            migrationBuilder.CreateIndex(
                name: "IX_document_uploads_city_hint_id",
                table: "document_uploads",
                column: "city_hint_id");

            migrationBuilder.CreateIndex(
                name: "IX_document_uploads_created_at",
                table: "document_uploads",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_document_uploads_ingestion_run_id",
                table: "document_uploads",
                column: "ingestion_run_id");

            migrationBuilder.CreateIndex(
                name: "IX_document_uploads_source_id",
                table: "document_uploads",
                column: "source_id");

            migrationBuilder.CreateIndex(
                name: "IX_document_uploads_status",
                table: "document_uploads",
                column: "status");

            migrationBuilder.AddForeignKey(
                name: "FK_articles_document_uploads_document_upload_id",
                table: "articles",
                column: "document_upload_id",
                principalTable: "document_uploads",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_articles_document_uploads_document_upload_id",
                table: "articles");

            migrationBuilder.DropTable(
                name: "document_uploads");

            migrationBuilder.DropIndex(
                name: "IX_articles_document_upload_id",
                table: "articles");

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "sources",
                keyColumn: "id",
                keyValue: 7);

            migrationBuilder.DropColumn(
                name: "scrape_config",
                table: "sources");

            migrationBuilder.DropColumn(
                name: "document_upload_id",
                table: "articles");
        }
    }
}
