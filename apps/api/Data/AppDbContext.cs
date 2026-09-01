using NewsFeed.Api.Data.Entities;
using NewsFeed.Api.Ingest;
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
    public DbSet<ArticleView> ArticleViews => Set<ArticleView>();
    public DbSet<IngestionJob> IngestionJobs => Set<IngestionJob>();
    public DbSet<ArticleAuditLog> ArticleAuditLogs => Set<ArticleAuditLog>();
    public DbSet<NotificationSubscription> NotificationSubscriptions => Set<NotificationSubscription>();

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
            entity.Property(c => c.Latitude).HasColumnName("latitude").IsRequired();
            entity.Property(c => c.Longitude).HasColumnName("longitude").IsRequired();
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
            // Sources 21-28 were inserted by the existing ExpandLocalNewsSourceCatalog
            // migration rather than EF model seeding. Keep them out of HasData so a
            // later migration never attempts to insert those production rows again.
            entity.HasData([
                .. SeedData.Sources.Where(source => source.Id <= 20),
                .. SeedData.IndiaExpansionSources,
            ]);
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

        modelBuilder.Entity<IngestionJob>(entity =>
        {
            entity.ToTable("ingestion_jobs");
            entity.HasKey(j => j.Id);
            entity.Property(j => j.Id).HasColumnName("id");
            entity.Property(j => j.SourceId).HasColumnName("source_id");
            entity.Property(j => j.IngestionRunId).HasColumnName("ingestion_run_id");
            entity.Property(j => j.Status)
                .HasColumnName("status")
                .HasConversion<string>()
                .HasMaxLength(32)
                .IsRequired();
            entity.Property(j => j.Attempts).HasColumnName("attempts");
            entity.Property(j => j.CreatedAt).HasColumnName("created_at");
            entity.Property(j => j.StartedAt).HasColumnName("started_at");
            entity.Property(j => j.CompletedAt).HasColumnName("completed_at");
            entity.Property(j => j.ErrorSummary).HasColumnName("error_summary").HasMaxLength(1000);
            entity.HasOne(j => j.Source)
                .WithMany(s => s.IngestionJobs)
                .HasForeignKey(j => j.SourceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(j => j.IngestionRun)
                .WithOne(r => r.IngestionJob)
                .HasForeignKey<IngestionJob>(j => j.IngestionRunId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(j => new { j.Status, j.CreatedAt });
            entity.HasIndex(j => j.IngestionRunId).IsUnique();
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
            entity.Property(a => a.Body).HasColumnName("body");
            entity.Property(a => a.SourceName).HasColumnName("source_name").HasMaxLength(120).IsRequired();
            entity.Property(a => a.SourceUrl).HasColumnName("source_url").HasMaxLength(ArticleSourceUrl.MaxLength).IsRequired();
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

        modelBuilder.Entity<ArticleAuditLog>(entity =>
        {
            entity.ToTable("article_audit_logs");
            entity.HasKey(l => l.Id);
            entity.Property(l => l.Id).HasColumnName("id");
            entity.Property(l => l.ArticleId).HasColumnName("article_id");
            entity.Property(l => l.Action).HasColumnName("action").HasMaxLength(40).IsRequired();
            entity.Property(l => l.Actor).HasColumnName("actor").HasMaxLength(80).IsRequired();
            entity.Property(l => l.OccurredAt).HasColumnName("occurred_at");
            entity.HasOne(l => l.Article)
                .WithMany(a => a.AuditLogs)
                .HasForeignKey(l => l.ArticleId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(l => new { l.ArticleId, l.OccurredAt });
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

        modelBuilder.Entity<ArticleView>(entity =>
        {
            entity.ToTable("article_views");
            entity.HasKey(v => v.Id);
            entity.Property(v => v.Id).HasColumnName("id");
            entity.Property(v => v.ArticleId).HasColumnName("article_id");
            entity.Property(v => v.ViewedAt).HasColumnName("viewed_at");
            entity.Property(v => v.SessionKey).HasColumnName("session_key").HasMaxLength(64);
            entity.HasIndex(v => new { v.ArticleId, v.ViewedAt });
            entity.HasIndex(v => new { v.ArticleId, v.SessionKey, v.ViewedAt });
            entity.HasOne(v => v.Article)
                .WithMany(a => a.Views)
                .HasForeignKey(v => v.ArticleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<NotificationSubscription>(entity =>
        {
            entity.ToTable("notification_subscriptions");
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Id).HasColumnName("id");
            entity.Property(s => s.ClientId).HasColumnName("client_id").HasMaxLength(80).IsRequired();
            entity.Property(s => s.Platform)
                .HasColumnName("platform")
                .HasConversion<string>()
                .HasMaxLength(16)
                .IsRequired();
            entity.Property(s => s.CityId).HasColumnName("city_id");
            entity.Property(s => s.DeliveryMode)
                .HasColumnName("delivery_mode")
                .HasConversion<string>()
                .HasMaxLength(32)
                .IsRequired();
            entity.Property(s => s.Categories).HasColumnName("categories").HasMaxLength(400).IsRequired();
            entity.Property(s => s.PreferredLanguage).HasColumnName("preferred_language").HasMaxLength(8);
            entity.Property(s => s.ExpoPushToken).HasColumnName("expo_push_token").HasMaxLength(512);
            entity.Property(s => s.WebPushEndpoint).HasColumnName("web_push_endpoint").HasMaxLength(1000);
            entity.Property(s => s.WebPushP256Dh).HasColumnName("web_push_p256dh").HasMaxLength(512);
            entity.Property(s => s.WebPushAuth).HasColumnName("web_push_auth").HasMaxLength(256);
            entity.Property(s => s.IsEnabled).HasColumnName("is_enabled").HasDefaultValue(true);
            entity.Property(s => s.PermissionGrantedAt).HasColumnName("permission_granted_at");
            entity.Property(s => s.PermissionDeniedAt).HasColumnName("permission_denied_at");
            entity.Property(s => s.LastPromptAt).HasColumnName("last_prompt_at");
            entity.Property(s => s.LastDeliveredAt).HasColumnName("last_delivered_at");
            entity.Property(s => s.CreatedAt).HasColumnName("created_at");
            entity.Property(s => s.UpdatedAt).HasColumnName("updated_at");
            entity.HasOne(s => s.City)
                .WithMany()
                .HasForeignKey(s => s.CityId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(s => new { s.ClientId, s.Platform }).IsUnique();
            entity.HasIndex(s => new { s.CityId, s.IsEnabled });
            entity.HasIndex(s => s.UpdatedAt);
        });
    }
}
