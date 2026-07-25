namespace IdentityHabits.Api.Models;

public class Habit
{
    public Guid Id { get; set; }
    public Guid IdentityId { get; set; }
    public required string Name { get; set; }
    public FrequencyType FrequencyType { get; set; }
    public int TargetPerWeek { get; set; }

    /// <summary>
    /// Bitmask of the weekdays this habit is scheduled on (see <see cref="DayMask"/>).
    /// Defaults to every day so existing habits keep showing up daily.
    /// </summary>
    public int ScheduledDays { get; set; } = DayMask.AllDays;

    public bool IsArchived { get; set; } = false;
    public DateTime CreatedAt { get; set; }

    public Identity? Identity { get; set; }
    public List<HabitLog> HabitLogs { get; set; } = [];
}
