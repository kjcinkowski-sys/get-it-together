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
    /// <summary>
    /// How far back completed logs are loaded for streak and growth math. Comfortably longer
    /// than the two-month top growth threshold so a full streak can always be reconstructed.
    /// </summary>
    private const int HistoryWindowDays = 400;

    public static void MapDashboardEndpoints(this WebApplication app)
    {
        app.MapGet("/api/dashboard/today", async (ClaimsPrincipal claims, AppDbContext db, DateOnly? date) =>
        {
            var userId = claims.GetUserId();
            var todayUtc = DateOnly.FromDateTime(DateTime.UtcNow);

            // The day being viewed. Defaults to today; a past date lets the user review that
            // day. Future dates are clamped to today — there is nothing to show ahead of now.
            var reference = date is { } d && d < todayUtc ? d : todayUtc;
            var windowStart = reference.AddDays(-(HistoryWindowDays - 1));

            // Pull each identity with its active habits and the completed logs inside the
            // history window, then compute the viewed day's status, streaks and growth in memory.
            var identities = await db.Identities
                .Where(i => i.UserId == userId && !i.IsArchived)
                .OrderBy(i => i.CreatedAt)
                .Select(i => new
                {
                    i.Id,
                    i.Statement,
                    i.Companion,
                    i.CompanionName,
                    Habits = i.Habits
                        .Where(h => !h.IsArchived)
                        .OrderBy(h => h.CreatedAt)
                        .Select(h => new
                        {
                            h.Id,
                            h.Name,
                            h.Type,
                            h.ScheduledDays,
                            h.CreatedAt,
                            Status = h.HabitLogs
                                .Where(l => l.CompletedOn == reference)
                                .Select(l => (HabitLogStatus?)l.Status)
                                .FirstOrDefault(),
                            // The dates that drive this habit's streak: completions for a build
                            // habit, slips for a break one. Only the relevant set is non-empty.
                            MarkDates = h.HabitLogs
                                .Where(l => l.CompletedOn >= windowStart
                                    && ((h.Type == HabitType.Break && l.Status == HabitLogStatus.Slipped)
                                        || (h.Type != HabitType.Break && l.Status == HabitLogStatus.Completed)))
                                .Select(l => l.CompletedOn)
                                .ToList(),
                        })
                        .ToList(),
                })
                .ToListAsync();

            var response = identities.Select(i =>
            {
                // Each habit's completed dates as a set + its creation date, reused for both the
                // per-habit streak and the identity's growth.
                var habits = i.Habits.Select(h => new
                {
                    h.Id,
                    h.Name,
                    h.Type,
                    h.ScheduledDays,
                    h.Status,
                    CreatedOn = DateOnly.FromDateTime(h.CreatedAt),
                    MarkSet = (IReadOnlySet<DateOnly>)h.MarkDates.ToHashSet(),
                }).ToList();

                var growth = GrowthCalculator.Compute(
                    habits.Select(h => new GrowthCalculator.HabitActivity(h.Type, h.ScheduledDays, h.CreatedOn, h.MarkSet)).ToList(),
                    reference);

                return new TodayIdentityResponse(
                    i.Id,
                    i.Statement,
                    i.Companion,
                    i.CompanionName,
                    growth.Stage,
                    growth.StageName,
                    growth.StageProgress,
                    growth.StreakDays,
                    habits
                        // Growth is scored across every habit above; the list the user sees for the
                        // day is just the ones that already existed and are due today. Build habits
                        // are due on their scheduled weekdays; break habits are daily by nature.
                        .Where(h => h.CreatedOn <= reference
                            && (h.Type == HabitType.Break
                                || DayMask.Includes(h.ScheduledDays, reference.DayOfWeek)))
                        .Select(h => new TodayHabitResponse(
                            h.Id,
                            h.Name,
                            h.Type,
                            DayMask.ToDays(h.ScheduledDays),
                            h.Type == HabitType.Break
                                ? StreakCalculator.CurrentCleanStreakDays(h.CreatedOn, h.MarkSet, reference)
                                : StreakCalculator.CurrentStreak(h.ScheduledDays, h.CreatedOn, h.MarkSet, reference),
                            h.Status))
                        .ToList());
            }).ToList();

            return Results.Ok(response);
        }).RequireAuthorization().WithTags("Dashboard");
    }
}
