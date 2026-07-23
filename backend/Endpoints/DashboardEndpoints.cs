using System.Security.Claims;
using IdentityHabits.Api.Auth;
using IdentityHabits.Api.Data;
using IdentityHabits.Api.Dtos;
using IdentityHabits.Api.Models;
using IdentityHabits.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace IdentityHabits.Api.Endpoints;

public static class DashboardEndpoints
{
    /// <summary>How far back the companion-creature strength score looks.</summary>
    private const int StrengthWindowDays = 28;

    public static void MapDashboardEndpoints(this WebApplication app)
    {
        app.MapGet("/api/dashboard/today", async (ClaimsPrincipal claims, AppDbContext db) =>
        {
            var userId = claims.GetUserId();
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var windowStart = today.AddDays(-(StrengthWindowDays - 1));

            // Pull each identity with its active habits and the completed logs inside the
            // scoring window, then compute today's status and the strength score in memory.
            var identities = await db.Identities
                .Where(i => i.UserId == userId && !i.IsArchived)
                .OrderBy(i => i.CreatedAt)
                .Select(i => new
                {
                    i.Id,
                    i.Statement,
                    i.Companion,
                    Habits = i.Habits
                        .Where(h => !h.IsArchived)
                        .OrderBy(h => h.CreatedAt)
                        .Select(h => new
                        {
                            h.Id,
                            h.Name,
                            h.FrequencyType,
                            h.TargetPerWeek,
                            h.CreatedAt,
                            TodayStatus = h.HabitLogs
                                .Where(l => l.CompletedOn == today)
                                .Select(l => (HabitLogStatus?)l.Status)
                                .FirstOrDefault(),
                            CompletedDates = h.HabitLogs
                                .Where(l => l.CompletedOn >= windowStart
                                    && l.Status == HabitLogStatus.Completed)
                                .Select(l => l.CompletedOn)
                                .ToList(),
                        })
                        .ToList(),
                })
                .ToListAsync();

            var response = identities.Select(i =>
            {
                var histories = i.Habits.Select(h => new StrengthCalculator.HabitHistory(
                    h.FrequencyType,
                    h.TargetPerWeek,
                    DateOnly.FromDateTime(h.CreatedAt),
                    h.CompletedDates));

                var strength = StrengthCalculator.ComputeStrength(histories, today);
                var stage = StrengthCalculator.ToStage(strength);

                return new TodayIdentityResponse(
                    i.Id,
                    i.Statement,
                    i.Companion,
                    strength,
                    stage,
                    StrengthCalculator.StageName(stage),
                    i.Habits
                        .Select(h => new TodayHabitResponse(
                            h.Id,
                            h.Name,
                            h.FrequencyType,
                            h.TargetPerWeek,
                            h.TodayStatus))
                        .ToList());
            }).ToList();

            return Results.Ok(response);
        }).RequireAuthorization().WithTags("Dashboard");
    }
}
