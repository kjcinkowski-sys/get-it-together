namespace IdentityHabits.Api.Services;

/// <summary>
/// Turns an identity's habit history into a companion-creature growth stage (0–4) and a
/// progress bar toward the next stage.
///
/// Growth is driven by the identity's <em>best current streak</em> — the longest running
/// streak among its habits, measured in calendar days. Completing any habit starts the climb;
/// sustaining one drives the creature up. The stages are deliberately gradual: a single
/// completion reaches stage 1, then it takes a week, a month, and two months of unbroken
/// consistency to reach the top. There is no stored state, so the value can never drift.
/// </summary>
public static class GrowthCalculator
{
    /// <summary>
    /// Days of unbroken consistency required to reach each stage above the start. Index 0 is the
    /// jump to stage 1 (any completion), then a week, a month, and two months.
    /// </summary>
    private static readonly int[] StageThresholdDays = { 1, 7, 30, 60 };

    private static readonly string[] StageNames =
        { "Dormant", "Spark", "Sprout", "Blaze", "Beacon" };

    /// <summary>The highest stage index a companion can reach.</summary>
    public static int MaxStage => StageThresholdDays.Length;

    /// <summary>One habit's schedule and completion history, decoupled from EF.</summary>
    public record HabitActivity(
        int ScheduledDaysMask,
        DateOnly CreatedOn,
        IReadOnlySet<DateOnly> CompletedDates);

    public record Growth(int StreakDays, int Stage, string StageName, int StageProgress);

    public static Growth Compute(IReadOnlyCollection<HabitActivity> habits, DateOnly today)
    {
        int streakDays = habits.Count == 0
            ? 0
            : habits.Max(h => StreakCalculator.CurrentStreakDays(
                h.ScheduledDaysMask, h.CreatedOn, h.CompletedDates, today));

        int stage = 0;
        foreach (var threshold in StageThresholdDays)
        {
            if (streakDays >= threshold)
            {
                stage++;
            }
        }

        return new Growth(
            streakDays,
            stage,
            StageNames[Math.Clamp(stage, 0, StageNames.Length - 1)],
            StageProgressPercent(streakDays, stage));
    }

    public static string StageName(int stage) => StageNames[Math.Clamp(stage, 0, StageNames.Length - 1)];

    /// <summary>How far, 0–100, the streak has progressed through the current stage's band.</summary>
    private static int StageProgressPercent(int streakDays, int stage)
    {
        if (stage >= MaxStage)
        {
            return 100; // fully grown — nothing left to progress toward
        }

        int lower = stage == 0 ? 0 : StageThresholdDays[stage - 1];
        int upper = StageThresholdDays[stage];
        if (upper <= lower)
        {
            return 0;
        }

        int pct = (int)Math.Round((streakDays - lower) / (double)(upper - lower) * 100);
        return Math.Clamp(pct, 0, 100);
    }
}
