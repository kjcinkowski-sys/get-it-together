namespace IdentityHabits.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public required string DisplayName { get; set; }

    /// <summary>
    /// Profile picture, stored as a data URL (e.g. "data:image/png;base64,...").
    /// The app has no object storage, so small avatars live inline in the row.
    /// Null means the user hasn't set one and the UI shows their initials.
    /// </summary>
    public string? AvatarUrl { get; set; }

    /// <summary>
    /// IANA time zone id (e.g. "America/New_York"). Habit streaks and daily
    /// check-ins are date-based, so knowing the user's zone lets us decide what
    /// "today" means for them rather than guessing from the browser each request.
    /// </summary>
    public string? TimeZone { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<Identity> Identities { get; set; } = [];
}
