using IdentityHabits.Api.Models;

namespace IdentityHabits.Api.Services;

/// <summary>
/// Computes an identity's "consistency strength" (0–100) purely from its habit-completion
/// history, and maps that strength onto a companion-creature growth stage.
///
/// The score is intentionally forgiving: it is a recency-weighted average of how well each
/// habit hit its weekly target over the last few weeks. A strong recent week grows the
/// creature; a slow week lets it drift down gently — but nothing ever resets to zero.
/// There is no stored state, so the value can never drift out of sync or be gamed.
/// </summary>
public static class StrengthCalculator
{
    /// <summary>Number of trailing weeks considered when scoring a habit.</summary>
    private const int WeeksConsidered = 4;

    /// <summary>
    /// Per-week weights, newest week first. Recent behaviour dominates (~2-week half-life),
    /// which is what produces the "grows when you show up, decays when you don't" feel.
    /// </summary>
    private static readonly double[] WeekWeights = { 1.0, 0.7, 0.49, 0.343 };

    /// <summary>Stage cut-points. strength &gt;= Thresholds[i] ⇒ at least stage i+1.</summary>
    private static readonly int[] StageThresholds = { 15, 40, 65, 90 };

    private static readonly string[] StageNames =
        { "Dormant", "Spark", "Sprout", "Blaze", "Beacon" };

    /// <summary>One habit's history, decoupled from EF so this stays a pure function.</summary>
    public record HabitHistory(
        FrequencyType FrequencyType,
        int TargetPerWeek,
        DateOnly CreatedOn,
        IReadOnlyCollection<DateOnly> CompletedDates);

    /// <summary>
    /// Returns the identity's strength as an integer 0–100. An identity with no habits,
    /// or no evidence at all, scores 0.
    /// </summary>
    public static int ComputeStrength(IEnumerable<HabitHistory> habits, DateOnly today)
    {
        double total = 0;
        int counted = 0;

        foreach (var habit in habits)
        {
            var (score, hadAnyWeek) = ScoreHabit(habit, today);
            if (!hadAnyWeek)
            {
                continue; // habit is too new to have a scorable week yet
            }

            total += score;
            counted++;
        }

        if (counted == 0)
        {
            return 0;
        }

        return (int)Math.Round(total / counted * 100);
    }

    /// <summary>Maps a 0–100 strength onto a growth stage index 0–4.</summary>
    public static int ToStage(int strength)
    {
        int stage = 0;
        foreach (var threshold in StageThresholds)
        {
            if (strength >= threshold)
            {
                stage++;
            }
        }

        return stage;
    }

    public static string StageName(int stage) => StageNames[Math.Clamp(stage, 0, StageNames.Length - 1)];

    private static (double Score, bool HadAnyWeek) ScoreHabit(HabitHistory habit, DateOnly today)
    {
        // Treat a daily habit as a target of 7/week so both frequency types score on the
        // same 0–1 scale ("did you hit target this week?").
        int expectedPerWeek = habit.FrequencyType == FrequencyType.Daily
            ? 7
            : Math.Max(1, habit.TargetPerWeek);

        double weightedScore = 0;
        double weightTotal = 0;

        for (int week = 0; week < WeeksConsidered; week++)
        {
            var weekEnd = today.AddDays(-7 * week);
            var weekStart = weekEnd.AddDays(-6);

            // Skip weeks entirely before the habit existed so a brand-new habit isn't
            // punished for time it wasn't around.
            if (weekEnd < habit.CreatedOn)
            {
                continue;
            }

            // Pro-rate the target if the habit was created partway through the week.
            int daysActive = 7;
            if (habit.CreatedOn > weekStart)
            {
                daysActive = weekEnd.DayNumber - habit.CreatedOn.DayNumber + 1;
            }

            double expected = expectedPerWeek * (daysActive / 7.0);
            if (expected <= 0)
            {
                continue;
            }

            int completed = habit.CompletedDates.Count(d => d >= weekStart && d <= weekEnd);
            double ratio = Math.Min(1.0, completed / expected);

            weightedScore += ratio * WeekWeights[week];
            weightTotal += WeekWeights[week];
        }

        return weightTotal > 0 ? (weightedScore / weightTotal, true) : (0, false);
    }
}
