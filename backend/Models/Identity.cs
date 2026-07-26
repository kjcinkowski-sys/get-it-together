namespace IdentityHabits.Api.Models;

public class Identity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public required string Statement { get; set; }
    public CompanionType Companion { get; set; } = CompanionType.Sprite;
    /// <summary>Optional user-given name for this identity's companion.</summary>
    public string? CompanionName { get; set; }
    public bool IsArchived { get; set; } = false;
    public DateTime CreatedAt { get; set; }

    public User? User { get; set; }
    public List<Habit> Habits { get; set; } = [];
}
