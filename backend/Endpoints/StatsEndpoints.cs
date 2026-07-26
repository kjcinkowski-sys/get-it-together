using System.Security.Claims;
using IdentityHabits.Api.Auth;
using IdentityHabits.Api.Data;
using IdentityHabits.Api.Dtos;
using IdentityHabits.Api.Models;
using IdentityHabits.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace IdentityHabits.Api.Endpoints;

public static class StatsEndpoints
{
    /// <summary>How far back completed logs are loaded for streak and rate math.</summary>
    private const int HistoryWindowDays = 400;

    /// <summary>Trailing window used for the per-habit completion rate.</summary>
    private const int CompletionRateWindowDays = 30;

    public static void MapStatsEndpoints(this WebApplication app)
    {
        app.MapGet("/api/stats", async (ClaimsPrincipal claims, AppDbContext db) =>
        {
            var userId = claims.GetUserId();
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var windowStart = today.AddDays(-(HistoryWindowDays - 1));

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
                            h.ScheduledDays,
                            h.CreatedAt,
                            TotalCompletions = h.HabitLogs.Count(l => l.Status == HabitLogStatus.Completed),
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
                var habits = i.Habits.Select(h => new
                {
                    h.Id,
                    h.Name,
                    h.ScheduledDays,
                    h.TotalCompletions,
                    CreatedOn = DateOnly.FromDateTime(h.CreatedAt),
                    CompletedSet = (IReadOnlySet<DateOnly>)h.CompletedDates.ToHashSet(),
                }).ToList();

                var growth = GrowthCalculator.Compute(
                    habits.Select(h => new GrowthCalculator.HabitActivity(h.ScheduledDays, h.CreatedOn, h.CompletedSet)).ToList(),
                    today);

                return new StatsIdentityResponse(
                    i.Id,
                    i.Statement,
                    i.Companion,
                    growth.Stage,
                    growth.StageName,
                    growth.StageProgress,
                    growth.StreakDays,
                    habits.Select(h => new StatsHabitResponse(
                        h.Id,
                        h.Name,
                        DayMask.ToDays(h.ScheduledDays),
                        StreakCalculator.CurrentStreak(h.ScheduledDays, h.CreatedOn, h.CompletedSet, today),
                        StreakCalculator.LongestStreak(h.ScheduledDays, h.CreatedOn, h.CompletedSet, today),
                        h.TotalCompletions,
                        CompletionRate(h.ScheduledDays, h.CreatedOn, h.CompletedSet, today)))
                        .ToList());
            }).ToList();

            return Results.Ok(response);
        }).RequireAuthorization().WithTags("Stats");
    }

    /// <summary>
    /// Percentage of the habit's due scheduled occurrences in the trailing window that were
    /// completed. Today is excluded (it may still be pending). Returns 0 when nothing was due.
    /// </summary>
    private static int CompletionRate(
        int scheduledDaysMask,
        DateOnly createdOn,
        IReadOnlySet<DateOnly> completedDates,
        DateOnly today)
    {
        var windowStart = today.AddDays(-(CompletionRateWindowDays - 1));
        int due = 0;
        int done = 0;

        for (var day = windowStart; day < today; day = day.AddDays(1))
        {
            if (day < createdOn || !DayMask.Includes(scheduledDaysMask, day.DayOfWeek))
            {
                continue;
            }

            due++;
            if (completedDates.Contains(day))
            {
                done++;
            }
        }

        return due == 0 ? 0 : (int)Math.Round(done / (double)due * 100);
    }
}
