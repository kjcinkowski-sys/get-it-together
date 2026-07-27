namespace IdentityHabits.Api.Models;

/// <summary>
/// Whether a habit is one to <em>build</em> (a good habit you check in as done) or one to
/// <em>break</em> (a bad habit you're avoiding). The two share the same storage and endpoints but
/// score streaks inversely: a build habit's streak counts days you did it, a break habit's counts
/// days you didn't slip.
/// </summary>
public enum HabitType
{
    Build,
    Break
}
