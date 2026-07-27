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
                            h.Type,
                            h.ScheduledDays,
                            h.CreatedAt,
                            // For a build habit this is the all-time completion count; for a break
                            // habit it's the all-time slip count.
                            TotalMarks = h.HabitLogs.Count(l =>
                                (h.Type == HabitType.Break && l.Status == HabitLogStatus.Slipped)
                                || (h.Type != HabitType.Break && l.Status == HabitLogStatus.Completed)),
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
                var habits = i.Habits.Select(h => new
                {
                    h.Id,
                    h.Name,
                    h.Type,
                    h.ScheduledDays,
                    h.TotalMarks,
                    CreatedOn = DateOnly.FromDateTime(h.CreatedAt),
                    MarkSet = (IReadOnlySet<DateOnly>)h.MarkDates.ToHashSet(),
                }).ToList();

                var growth = GrowthCalculator.Compute(
                    habits.Select(h => new GrowthCalculator.HabitActivity(h.Type, h.ScheduledDays, h.CreatedOn, h.MarkSet)).ToList(),
                    today);

                return new StatsIdentityResponse(
                    i.Id,
                    i.Statement,
                    i.Companion,
                    growth.Stage,
                    growth.StageName,
                    growth.StageProgress,
                    growth.StreakDays,
                    habits.Select(h => h.Type == HabitType.Break
                        ? new StatsHabitResponse(
                            h.Id,
                            h.Name,
                            h.Type,
                            DayMask.ToDays(h.ScheduledDays),
                            StreakCalculator.CurrentCleanStreakDays(h.CreatedOn, h.MarkSet, today),
                            StreakCalculator.LongestCleanStreak(h.CreatedOn, h.MarkSet, today),
                            h.TotalMarks, // total slips
                            SlipFreeRate(h.CreatedOn, h.MarkSet, today))
                        : new StatsHabitResponse(
                            h.Id,
                            h.Name,
                            h.Type,
                            DayMask.ToDays(h.ScheduledDays),
                            StreakCalculator.CurrentStreak(h.ScheduledDays, h.CreatedOn, h.MarkSet, today),
                            StreakCalculator.LongestStreak(h.ScheduledDays, h.CreatedOn, h.MarkSet, today),
                            h.TotalMarks, // total completions
                            CompletionRate(h.ScheduledDays, h.CreatedOn, h.MarkSet, today)))
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

    /// <summary>
    /// Percentage of days in the trailing window (since the habit was created) that stayed clean —
    /// no slip logged. Today is excluded (it may still be pending). Returns 100 when there were no
    /// days to judge yet, matching the "silence is success" default.
    /// </summary>
    private static int SlipFreeRate(
        DateOnly createdOn,
        IReadOnlySet<DateOnly> slipDates,
        DateOnly today)
    {
        var windowStart = today.AddDays(-(CompletionRateWindowDays - 1));
        int days = 0;
        int clean = 0;

        for (var day = windowStart; day < today; day = day.AddDays(1))
        {
            if (day < createdOn)
            {
                continue;
            }

            days++;
            if (!slipDates.Contains(day))
            {
                clean++;
            }
        }

        return days == 0 ? 100 : (int)Math.Round(clean / (double)days * 100);
    }
}
