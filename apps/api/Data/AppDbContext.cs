using NewsFeed.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace NewsFeed.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<City> Cities => Set<City>();
    public DbSet<Article> Articles => Set<Article>();
    public DbSet<Source> Sources => Set<Source>();
    public DbSet<IngestionRun> IngestionRuns => Set<IngestionRun>();
    public DbSet<DocumentUpload> DocumentUploads => Set<DocumentUpload>();
    public DbSet<ArticleTranslation> ArticleTranslations => Set<ArticleTranslation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<City>(entity =>
        {
            entity.ToTable("cities");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).HasColumnName("id");
            entity.Property(c => c.Name).HasColumnName("name").HasMaxLength(120).IsRequired();
            entity.Property(c => c.State).HasColumnName("state").HasMaxLength(120).IsRequired();
            entity.Property(c => c.Slug).HasColumnName("slug").HasMaxLength(80).IsRequired();
            entity.HasIndex(c => c.Slug).IsUnique();
            entity.HasData(SeedData.Cities);
        });

        modelBuilder.Entity<Source>(entity =>
        {
            entity.ToTable("sources");
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Id).HasColumnName("id");
            entity.Property(s => s.Name).HasColumnName("name").HasMaxLength(120).IsRequired();
            entity.Property(s => s.FeedUrl).HasColumnName("feed_url").HasMaxLength(500);
            entity.Property(s => s.CityId).HasColumnName("city_id");
            entity.Property(s => s.Type).HasColumnName("type").HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(s => s.Kind).HasColumnName("kind").HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(s => s.Language).HasColumnName("language").HasMaxLength(8).IsRequired();
            entity.Property(s => s.IsActive).HasColumnName("is_active");
            entity.Property(s => s.LastFetchedAt).HasColumnName("last_fetched_at");
            entity.Property(s => s.LastFetchStatus).HasColumnName("last_fetch_status").HasConversion<string>().HasMaxLength(32);
            entity.Property(s => s.LastErrorMessage).HasColumnName("last_error_message").HasMaxLength(1000);
            entity.Property(s => s.ScrapeConfig).HasColumnName("scrape_config").HasMaxLength(4000);
            entity.HasOne(s => s.City)
                .WithMany(c => c.Sources)
                .HasForeignKey(s => s.CityId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(s => s.FeedUrl)
                .IsUnique()
                .HasFilter("\"type\" = 'Rss' AND \"feed_url\" IS NOT NULL");
            entity.HasData(SeedData.Sources);
        });

        modelBuilder.Entity<IngestionRun>(entity =>
        {
            entity.ToTable("ingestion_runs");
            entity.HasKey(r => r.Id);
            entity.Property(r => r.Id).HasColumnName("id");
            entity.Property(r => r.SourceId).HasColumnName("source_id");
            entity.Property(r => r.StartedAt).HasColumnName("started_at");
            entity.Property(r => r.CompletedAt).HasColumnName("completed_at");
            entity.Property(r => r.ArticlesFound).HasColumnName("articles_found");
            entity.Property(r => r.ArticlesAdded).HasColumnName("articles_added");
            entity.Property(r => r.ArticlesSkipped).HasColumnName("articles_skipped");
            entity.Property(r => r.ArticlesFailed).HasColumnName("articles_failed");
            entity.Property(r => r.ErrorSummary).HasColumnName("error_summary").HasMaxLength(1000);
            entity.HasOne(r => r.Source)
                .WithMany(s => s.IngestionRuns)
                .HasForeignKey(r => r.SourceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(r => new { r.SourceId, r.StartedAt });
        });

        modelBuilder.Entity<DocumentUpload>(entity =>
        {
            entity.ToTable("document_uploads");
            entity.HasKey(d => d.Id);
            entity.Property(d => d.Id).HasColumnName("id");
            entity.Property(d => d.OriginalFileName).HasColumnName("original_file_name").HasMaxLength(260).IsRequired();
            entity.Property(d => d.StoredPath).HasColumnName("stored_path").HasMaxLength(500).IsRequired();
            entity.Property(d => d.ContentType).HasColumnName("content_type").HasMaxLength(127).IsRequired();
            entity.Property(d => d.ByteSize).HasColumnName("byte_size");
            entity.Property(d => d.CityHintId).HasColumnName("city_hint_id");
            entity.Property(d => d.Status)
                .HasColumnName("status")
                .HasConversion<string>()
                .HasMaxLength(32)
                .IsRequired();
            entity.Property(d => d.ErrorSummary).HasColumnName("error_summary").HasMaxLength(1000);
            entity.Property(d => d.IngestionRunId).HasColumnName("ingestion_run_id");
            entity.Property(d => d.SourceId).HasColumnName("source_id");
            entity.Property(d => d.CreatedAt).HasColumnName("created_at");
            entity.Property(d => d.ProcessedAt).HasColumnName("processed_at");
            entity.HasOne(d => d.CityHint)
                .WithMany()
                .HasForeignKey(d => d.CityHintId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(d => d.IngestionRun)
                .WithMany()
                .HasForeignKey(d => d.IngestionRunId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(d => d.Source)
                .WithMany()
                .HasForeignKey(d => d.SourceId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(d => d.Status);
            entity.HasIndex(d => d.CreatedAt);
        });

        modelBuilder.Entity<Article>(entity =>
        {
            entity.ToTable("articles");
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Id).HasColumnName("id");
            entity.Property(a => a.CityId).HasColumnName("city_id");
            entity.Property(a => a.Headline).HasColumnName("headline").HasMaxLength(300).IsRequired();
            entity.Property(a => a.Summary).HasColumnName("summary").HasMaxLength(1000).IsRequired();
            entity.Property(a => a.SourceName).HasColumnName("source_name").HasMaxLength(120).IsRequired();
            entity.Property(a => a.SourceUrl).HasColumnName("source_url").HasMaxLength(500).IsRequired();
            entity.Property(a => a.PublishedAt).HasColumnName("published_at");
            entity.Property(a => a.Category).HasColumnName("category").HasMaxLength(40).IsRequired();
            entity.Property(a => a.ImageUrl).HasColumnName("image_url").HasMaxLength(500);
            entity.Property(a => a.ImageEnrichmentAttemptedAt).HasColumnName("image_enrichment_attempted_at");
            entity.Property(a => a.Status)
                .HasColumnName("status")
                .HasConversion<string>()
                .HasMaxLength(32)
                .IsRequired()
                .HasDefaultValue(ArticleStatus.Published);
            entity.Property(a => a.IsMock).HasColumnName("is_mock").HasDefaultValue(false);
            entity.Property(a => a.IngestedAt).HasColumnName("ingested_at");
            entity.Property(a => a.ReviewedBy).HasColumnName("reviewed_by").HasMaxLength(80);
            entity.Property(a => a.ReviewedAt).HasColumnName("reviewed_at");
            entity.Property(a => a.SourceId).HasColumnName("source_id");
            entity.Property(a => a.DocumentUploadId).HasColumnName("document_upload_id");
            entity.Property(a => a.DetectedLanguage)
                .HasColumnName("detected_language")
                .HasMaxLength(8)
                .IsRequired()
                .HasDefaultValue("en");
            entity.HasIndex(a => new { a.CityId, a.PublishedAt });
            entity.HasIndex(a => a.SourceUrl).IsUnique();
            entity.HasIndex(a => new { a.Status, a.CityId });
            entity.HasIndex(a => a.SourceId);
            entity.HasIndex(a => a.DocumentUploadId);
            entity.HasOne(a => a.City)
                .WithMany(c => c.Articles)
                .HasForeignKey(a => a.CityId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(a => a.Source)
                .WithMany(s => s.Articles)
                .HasForeignKey(a => a.SourceId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(a => a.DocumentUpload)
                .WithMany(d => d.Articles)
                .HasForeignKey(a => a.DocumentUploadId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasData(SeedData.Articles);
        });

        modelBuilder.Entity<ArticleTranslation>(entity =>
        {
            entity.ToTable("article_translations");
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Id).HasColumnName("id");
            entity.Property(t => t.ArticleId).HasColumnName("article_id");
            entity.Property(t => t.TargetLanguage).HasColumnName("target_language").HasMaxLength(8).IsRequired();
            entity.Property(t => t.TranslatedHeadline).HasColumnName("translated_headline").HasMaxLength(300).IsRequired();
            entity.Property(t => t.TranslatedSummary).HasColumnName("translated_summary").HasMaxLength(1000).IsRequired();
            entity.Property(t => t.TranslatedAt).HasColumnName("translated_at");
            entity.Property(t => t.Status)
                .HasColumnName("status")
                .HasConversion<string>()
                .HasMaxLength(32)
                .IsRequired();
            entity.HasIndex(t => new { t.ArticleId, t.TargetLanguage }).IsUnique();
            entity.HasOne(t => t.Article)
                .WithMany(a => a.Translations)
                .HasForeignKey(t => t.ArticleId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
