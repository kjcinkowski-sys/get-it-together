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
                .Select(h => new HabitResponse(h.Id, h.IdentityId, h.Name, h.FrequencyType, h.TargetPerWeek, h.IsArchived, h.CreatedAt))
                .ToListAsync();

            return Results.Ok(habits);
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
                FrequencyType = request.FrequencyType,
                TargetPerWeek = request.TargetPerWeek,
                CreatedAt = DateTime.UtcNow,
            };

            db.Habits.Add(habit);
            await db.SaveChangesAsync();

            return Results.Created($"/api/habits/{habit.Id}",
                new HabitResponse(habit.Id, habit.IdentityId, habit.Name, habit.FrequencyType, habit.TargetPerWeek, habit.IsArchived, habit.CreatedAt));
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
            habit.FrequencyType = request.FrequencyType;
            habit.TargetPerWeek = request.TargetPerWeek;
            await db.SaveChangesAsync();

            return Results.Ok(new HabitResponse(habit.Id, habit.IdentityId, habit.Name, habit.FrequencyType, habit.TargetPerWeek, habit.IsArchived, habit.CreatedAt));
        }).RequireAuthorization().WithTags("Habits");

        app.MapPatch("/api/habits/{id:guid}/archive", async (Guid id, ClaimsPrincipal claims, AppDbContext db) =>
        {
            var habit = await FindOwnedHabit(db, id, claims.GetUserId());
            if (habit is null) return Results.NotFound();

            habit.IsArchived = true;
            await db.SaveChangesAsync();

            return Results.NoContent();
        }).RequireAuthorization().WithTags("Habits");
    }

    internal static Task<Habit?> FindOwnedHabit(AppDbContext db, Guid habitId, Guid userId) =>
        db.Habits
            .Include(h => h.Identity)
            .SingleOrDefaultAsync(h => h.Id == habitId && h.Identity!.UserId == userId);
}
