namespace IdentityHabits.Api.Dtos;

public record CreateHabitRequest(string Name, IReadOnlyList<int>? ScheduledDays);

public record UpdateHabitRequest(string Name, IReadOnlyList<int>? ScheduledDays);

public record HabitResponse(
    Guid Id,
    Guid IdentityId,
    string Name,
    IReadOnlyList<int> ScheduledDays,
    bool IsArchived,
    DateTime CreatedAt);
