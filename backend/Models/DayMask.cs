namespace IdentityHabits.Api.Models;

/// <summary>
/// Helpers for the <see cref="Habit.ScheduledDays"/> bitmask, which records the days of the
/// week a habit is scheduled. Bit <c>i</c> corresponds to day <c>i</c> where 0 = Sunday …
/// 6 = Saturday, matching both .NET's <see cref="System.DayOfWeek"/> and JavaScript's
/// <c>Date.getDay()</c> so the value is easy to consume on either side.
/// </summary>
public static class DayMask
{
    /// <summary>Every day selected (0b111_1111 = 127). The default for a new habit.</summary>
    public const int AllDays = 0b111_1111;

    /// <summary>Builds a bitmask from day numbers (0–6). Out-of-range values are ignored.</summary>
    public static int FromDays(IEnumerable<int> days)
    {
        int mask = 0;
        foreach (var day in days)
        {
            if (day is >= 0 and <= 6)
            {
                mask |= 1 << day;
            }
        }

        return mask;
    }

    /// <summary>Expands a bitmask into ascending day numbers (0–6).</summary>
    public static IReadOnlyList<int> ToDays(int mask)
    {
        var days = new List<int>();
        for (int day = 0; day <= 6; day++)
        {
            if ((mask & (1 << day)) != 0)
            {
                days.Add(day);
            }
        }

        return days;
    }

    /// <summary>True when the given weekday is included in the mask.</summary>
    public static bool Includes(int mask, DayOfWeek day) => (mask & (1 << (int)day)) != 0;
}
