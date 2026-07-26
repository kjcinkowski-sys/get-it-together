using IdentityHabits.Api.Models;

namespace IdentityHabits.Api.Services;

/// <summary>
/// Streaks for a single habit, derived from its scheduled weekdays and the dates it was
/// completed. A streak counts consecutive <em>scheduled</em> occurrences that were completed.
/// Today counts as pending — not a miss — until the day is over, so a habit you haven't
/// checked in yet today never zeroes out an otherwise healthy streak.
/// </summary>
public static class StreakCalculator
{
    /// <summary>
    /// The current run of consecutive completed scheduled occurrences, counting back from today.
    /// </summary>
    public static int CurrentStreak(
        int scheduledDaysMask,
        DateOnly createdOn,
        IReadOnlySet<DateOnly> completedDates,
        DateOnly today)
    {
        int streak = 0;
        for (var day = today; day >= createdOn; day = day.AddDays(-1))
        {
            if (!DayMask.Includes(scheduledDaysMask, day.DayOfWeek))
            {
                continue; // not a scheduled day — skip it entirely
            }

            if (completedDates.Contains(day))
            {
                streak++;
            }
            else if (day == today)
            {
                continue; // today isn't over yet — pending, not a miss
            }
            else
            {
                break; // a past scheduled day was missed — the streak ends here
            }
        }

        return streak;
    }

    /// <summary>
    /// The longest run of consecutive completed scheduled occurrences across the loaded history.
    /// </summary>
    public static int LongestStreak(
        int scheduledDaysMask,
        DateOnly createdOn,
        IReadOnlySet<DateOnly> completedDates,
        DateOnly today)
    {
        int best = 0;
        int current = 0;

        for (var day = createdOn; day <= today; day = day.AddDays(1))
        {
            if (!DayMask.Includes(scheduledDaysMask, day.DayOfWeek))
            {
                continue;
            }

            if (day == today && !completedDates.Contains(day))
            {
                continue; // pending today — don't let it reset the historical best
            }

            if (completedDates.Contains(day))
            {
                current++;
                best = Math.Max(best, current);
            }
            else
            {
                current = 0;
            }
        }

        return best;
    }

    /// <summary>
    /// The length in calendar days of the habit's current streak (rest days between scheduled
    /// occurrences are bridged), used to drive companion growth. Returns 0 when there's no
    /// live streak.
    /// </summary>
    public static int CurrentStreakDays(
        int scheduledDaysMask,
        DateOnly createdOn,
        IReadOnlySet<DateOnly> completedDates,
        DateOnly today)
    {
        DateOnly? firstInRun = null;
        for (var day = today; day >= createdOn; day = day.AddDays(-1))
        {
            if (!DayMask.Includes(scheduledDaysMask, day.DayOfWeek))
            {
                continue;
            }

            if (completedDates.Contains(day))
            {
                firstInRun = day;
            }
            else if (day == today)
            {
                continue; // pending today
            }
            else
            {
                break;
            }
        }

        return firstInRun is null ? 0 : today.DayNumber - firstInRun.Value.DayNumber + 1;
    }
}
