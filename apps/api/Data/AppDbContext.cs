using Microsoft.EntityFrameworkCore;

namespace Buildy.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // Domain entities land here as features are added.
    // Example: public DbSet<Article> Articles => Set<Article>();
}
