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

    // --- Break (bad) habits ---------------------------------------------------------------------
    //
    // A break habit inverts the rules above. Every calendar day counts (you can slip any day, not
    // just scheduled ones) and a day is clean unless a slip was logged for it — silence is success.
    // The streak is measured in calendar days, so it drops straight into the same growth math a
    // build habit's day-streak feeds.

    /// <summary>
    /// The current run of consecutive clean days for a break habit: full days with no slip, counted
    /// back from yesterday until the most recent slip. Today is still in progress, so it doesn't
    /// count yet — a brand-new habit sits at a 0-day streak until its first full clean day passes
    /// (mirroring how a build habit doesn't count a pending today). A slip logged today still breaks
    /// the run to 0. Bounded below by the day the habit was created.
    /// </summary>
    public static int CurrentCleanStreakDays(
        DateOnly createdOn,
        IReadOnlySet<DateOnly> slipDates,
        DateOnly today)
    {
        if (today < createdOn || slipDates.Contains(today))
        {
            return 0;
        }

        int streak = 0;
        for (var day = today.AddDays(-1); day >= createdOn; day = day.AddDays(-1))
        {
            if (slipDates.Contains(day))
            {
                break; // a slip ends the clean run
            }

            streak++;
        }

        return streak;
    }

    /// <summary>
    /// The longest run of consecutive clean days on record for a break habit. Counts only completed
    /// days (creation date through yesterday); today is still pending, matching the current-streak
    /// measure above.
    /// </summary>
    public static int LongestCleanStreak(
        DateOnly createdOn,
        IReadOnlySet<DateOnly> slipDates,
        DateOnly today)
    {
        int best = 0;
        int current = 0;

        for (var day = createdOn; day < today; day = day.AddDays(1))
        {
            if (slipDates.Contains(day))
            {
                current = 0;
            }
            else
            {
                current++;
                best = Math.Max(best, current);
            }
        }

        return best;
    }
}
