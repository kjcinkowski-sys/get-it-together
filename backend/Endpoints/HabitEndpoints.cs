using System.Security.Claims;
using IdentityHabits.Api.Auth;
using IdentityHabits.Api.Data;
using IdentityHabits.Api.Dtos;
using IdentityHabits.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IdentityHabits.Api.Endpoints;

public static class HabitEndpoints
{
    public static void MapHabitEndpoints(this WebApplication app)
    {
        app.MapGet("/api/identities/{identityId:guid}/habits", async (Guid identityId, ClaimsPrincipal claims, AppDbContext db) =>
        {
            var userId = claims.GetUserId();
            var identityExists = await db.Identities.AnyAsync(i => i.Id == identityId && i.UserId == userId);
            if (!identityExists) return Results.NotFound();

            var habits = await db.Habits
                .Where(h => h.IdentityId == identityId && !h.IsArchived)
                .OrderBy(h => h.CreatedAt)
                .ToListAsync();

            return Results.Ok(habits.Select(ToResponse));
        }).RequireAuthorization().WithTags("Habits");

        app.MapGet("/api/identities/{identityId:guid}/habits/archived", async (Guid identityId, ClaimsPrincipal claims, AppDbContext db) =>
        {
            var userId = claims.GetUserId();
            var identityExists = await db.Identities.AnyAsync(i => i.Id == identityId && i.UserId == userId);
            if (!identityExists) return Results.NotFound();

            var habits = await db.Habits
                .Where(h => h.IdentityId == identityId && h.IsArchived)
                .OrderBy(h => h.CreatedAt)
                .ToListAsync();

            return Results.Ok(habits.Select(ToResponse));
        }).RequireAuthorization().WithTags("Habits");

        app.MapGet("/api/habits/{id:guid}", async (Guid id, ClaimsPrincipal claims, AppDbContext db) =>
        {
            var habit = await FindOwnedHabit(db, id, claims.GetUserId());
            return habit is null ? Results.NotFound() : Results.Ok(ToResponse(habit));
        }).RequireAuthorization().WithTags("Habits");

        app.MapPost("/api/identities/{identityId:guid}/habits", async (Guid identityId, CreateHabitRequest request, ClaimsPrincipal claims, AppDbContext db) =>
        {
            var userId = claims.GetUserId();
            var identity = await db.Identities.SingleOrDefaultAsync(i => i.Id == identityId && i.UserId == userId);
            if (identity is null) return Results.NotFound();

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Results.BadRequest(new { message = "Name is required." });
            }

            var habit = new Habit
            {
                Id = Guid.NewGuid(),
                IdentityId = identityId,
                Name = request.Name.Trim(),
                ScheduledDays = ResolveScheduledDays(request.ScheduledDays),
                CreatedAt = DateTime.UtcNow,
            };

            db.Habits.Add(habit);
            await db.SaveChangesAsync();

            return Results.Created($"/api/habits/{habit.Id}", ToResponse(habit));
        }).RequireAuthorization().WithTags("Habits");

        app.MapPut("/api/habits/{id:guid}", async (Guid id, UpdateHabitRequest request, ClaimsPrincipal claims, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Results.BadRequest(new { message = "Name is required." });
            }

            var habit = await FindOwnedHabit(db, id, claims.GetUserId());
            if (habit is null) return Results.NotFound();

            habit.Name = request.Name.Trim();
            habit.ScheduledDays = ResolveScheduledDays(request.ScheduledDays);
            await db.SaveChangesAsync();

            return Results.Ok(ToResponse(habit));
        }).RequireAuthorization().WithTags("Habits");

        app.MapPatch("/api/habits/{id:guid}/archive", async (Guid id, ClaimsPrincipal claims, AppDbContext db) =>
        {
            var habit = await FindOwnedHabit(db, id, claims.GetUserId());
            if (habit is null) return Results.NotFound();

            habit.IsArchived = true;
            await db.SaveChangesAsync();

            return Results.NoContent();
        }).RequireAuthorization().WithTags("Habits");

        app.MapPatch("/api/habits/{id:guid}/restore", async (Guid id, ClaimsPrincipal claims, AppDbContext db) =>
        {
            var habit = await FindOwnedHabit(db, id, claims.GetUserId());
            if (habit is null) return Results.NotFound();

            habit.IsArchived = false;
            await db.SaveChangesAsync();

            return Results.NoContent();
        }).RequireAuthorization().WithTags("Habits");

        // Permanent hard delete. Cascade config (see AppDbContext) removes the habit's logs too.
        app.MapDelete("/api/habits/{id:guid}", async (Guid id, ClaimsPrincipal claims, AppDbContext db) =>
        {
            var habit = await FindOwnedHabit(db, id, claims.GetUserId());
            if (habit is null) return Results.NotFound();

            db.Habits.Remove(habit);
            await db.SaveChangesAsync();

            return Results.NoContent();
        }).RequireAuthorization().WithTags("Habits");
    }

    /// <summary>
    /// Turns the requested day numbers into a bitmask. A missing or empty selection falls back
    /// to every day, so a habit is never left scheduled on no days at all.
    /// </summary>
    private static int ResolveScheduledDays(IReadOnlyList<int>? days)
    {
        if (days is null || days.Count == 0)
        {
            return DayMask.AllDays;
        }

        var mask = DayMask.FromDays(days);
        return mask == 0 ? DayMask.AllDays : mask;
    }

    private static HabitResponse ToResponse(Habit habit) => new(
        habit.Id,
        habit.IdentityId,
        habit.Name,
        DayMask.ToDays(habit.ScheduledDays),
        habit.IsArchived,
        habit.CreatedAt);

    internal static Task<Habit?> FindOwnedHabit(AppDbContext db, Guid habitId, Guid userId) =>
        db.Habits
            .Include(h => h.Identity)
            .SingleOrDefaultAsync(h => h.Id == habitId && h.Identity!.UserId == userId);
}
