using IdentityHabits.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IdentityHabits.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Identity> Identities => Set<Identity>();
    public DbSet<Habit> Habits => Set<Habit>();
    public DbSet<HabitLog> HabitLogs => Set<HabitLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Identity>()
            .HasOne(i => i.User)
            .WithMany(u => u.Identities)
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Habit>()
            .HasOne(h => h.Identity)
            .WithMany(i => i.Habits)
            .HasForeignKey(h => h.IdentityId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<HabitLog>()
            .HasOne(l => l.Habit)
            .WithMany(h => h.HabitLogs)
            .HasForeignKey(l => l.HabitId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<HabitLog>()
            .HasIndex(l => new { l.HabitId, l.CompletedOn })
            .IsUnique();
    }
}
