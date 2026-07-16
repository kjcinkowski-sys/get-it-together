using System.Security.Claims;
using IdentityHabits.Api.Auth;
using IdentityHabits.Api.Data;
using IdentityHabits.Api.Dtos;
using IdentityHabits.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IdentityHabits.Api.Endpoints;

public static class HabitLogEndpoints
{
    public static void MapHabitLogEndpoints(this WebApplication app)
    {
        app.MapPut("/api/habits/{habitId:guid}/logs/{date}", async (Guid habitId, DateOnly date, UpsertHabitLogRequest request, ClaimsPrincipal claims, AppDbContext db) =>
        {
            var habit = await HabitEndpoints.FindOwnedHabit(db, habitId, claims.GetUserId());
            if (habit is null) return Results.NotFound();

            var log = await db.HabitLogs.SingleOrDefaultAsync(l => l.HabitId == habitId && l.CompletedOn == date);
            if (log is null)
            {
                log = new HabitLog
                {
                    Id = Guid.NewGuid(),
                    HabitId = habitId,
                    CompletedOn = date,
                    Status = request.Status,
                    Note = request.Note,
                    CreatedAt = DateTime.UtcNow,
                };
                db.HabitLogs.Add(log);
            }
            else
            {
                log.Status = request.Status;
                log.Note = request.Note;
            }

            await db.SaveChangesAsync();

            return Results.Ok(new HabitLogResponse(log.Id, log.HabitId, log.CompletedOn, log.Status, log.Note));
        }).RequireAuthorization().WithTags("HabitLogs");

        app.MapGet("/api/habits/{habitId:guid}/logs", async (Guid habitId, DateOnly? from, DateOnly? to, ClaimsPrincipal claims, AppDbContext db) =>
        {
            var habit = await HabitEndpoints.FindOwnedHabit(db, habitId, claims.GetUserId());
            if (habit is null) return Results.NotFound();

            var query = db.HabitLogs.Where(l => l.HabitId == habitId);
            if (from is not null) query = query.Where(l => l.CompletedOn >= from);
            if (to is not null) query = query.Where(l => l.CompletedOn <= to);

            var logs = await query
                .OrderBy(l => l.CompletedOn)
                .Select(l => new HabitLogResponse(l.Id, l.HabitId, l.CompletedOn, l.Status, l.Note))
                .ToListAsync();

            return Results.Ok(logs);
        }).RequireAuthorization().WithTags("HabitLogs");

        app.MapDelete("/api/habits/{habitId:guid}/logs/{date}", async (Guid habitId, DateOnly date, ClaimsPrincipal claims, AppDbContext db) =>
        {
            var habit = await HabitEndpoints.FindOwnedHabit(db, habitId, claims.GetUserId());
            if (habit is null) return Results.NotFound();

            var log = await db.HabitLogs.SingleOrDefaultAsync(l => l.HabitId == habitId && l.CompletedOn == date);
            if (log is null) return Results.NotFound();

            db.HabitLogs.Remove(log);
            await db.SaveChangesAsync();

            return Results.NoContent();
        }).RequireAuthorization().WithTags("HabitLogs");
    }
}
