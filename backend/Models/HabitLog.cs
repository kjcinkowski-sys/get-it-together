namespace IdentityHabits.Api.Models;

public class HabitLog
{
    public Guid Id { get; set; }
    public Guid HabitId { get; set; }
    public DateOnly CompletedOn { get; set; }
    public HabitLogStatus Status { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }

    public Habit? Habit { get; set; }
}
