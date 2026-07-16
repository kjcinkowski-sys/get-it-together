using System.Security.Claims;
using IdentityHabits.Api.Auth;
using IdentityHabits.Api.Data;
using IdentityHabits.Api.Dtos;
using IdentityHabits.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace IdentityHabits.Api.Endpoints;

public static class DashboardEndpoints
{
    public static void MapDashboardEndpoints(this WebApplication app)
    {
        app.MapGet("/api/dashboard/today", async (ClaimsPrincipal claims, AppDbContext db) =>
        {
            var userId = claims.GetUserId();
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var identities = await db.Identities
                .Where(i => i.UserId == userId && !i.IsArchived)
                .OrderBy(i => i.CreatedAt)
                .Select(i => new TodayIdentityResponse(
                    i.Id,
                    i.Statement,
                    i.Habits
                        .Where(h => !h.IsArchived)
                        .OrderBy(h => h.CreatedAt)
                        .Select(h => new TodayHabitResponse(
                            h.Id,
                            h.Name,
                            h.FrequencyType,
                            h.TargetPerWeek,
                            h.HabitLogs
                                .Where(l => l.CompletedOn == today)
                                .Select(l => (HabitLogStatus?)l.Status)
                                .FirstOrDefault()))
                        .ToList()))
                .ToListAsync();

            return Results.Ok(identities);
        }).RequireAuthorization().WithTags("Dashboard");
    }
}
