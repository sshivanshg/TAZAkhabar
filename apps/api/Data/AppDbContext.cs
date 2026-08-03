using NewsFeed.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace NewsFeed.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<City> Cities => Set<City>();
    public DbSet<Article> Articles => Set<Article>();

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
            entity.HasIndex(a => new { a.CityId, a.PublishedAt });
            entity.HasOne(a => a.City)
                .WithMany(c => c.Articles)
                .HasForeignKey(a => a.CityId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasData(SeedData.Articles);
        });
    }
}
