namespace IdentityHabits.Api.Models;

public class Habit
{
    public Guid Id { get; set; }
    public Guid IdentityId { get; set; }
    public required string Name { get; set; }

    /// <summary>
    /// Bitmask of the weekdays this habit is scheduled on (see <see cref="DayMask"/>).
    /// This is the habit's whole schedule: "daily" simply means all seven days are set,
    /// and the number of days set doubles as the weekly target.
    /// </summary>
    public int ScheduledDays { get; set; } = DayMask.AllDays;

    public bool IsArchived { get; set; } = false;
    public DateTime CreatedAt { get; set; }

    public Identity? Identity { get; set; }
    public List<HabitLog> HabitLogs { get; set; } = [];
}
