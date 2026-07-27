namespace IdentityHabits.Api.Models;

public enum HabitLogStatus
{
    Completed,
    Partial,
    Missed,

    /// <summary>
    /// A slip on a break (bad) habit — the day you did the thing you're trying to avoid. Break
    /// habits only ever store this status; a clean day is simply left unlogged (silence = success).
    /// </summary>
    Slipped
}
