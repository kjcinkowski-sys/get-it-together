using IdentityHabits.Api.Models;

namespace IdentityHabits.Api.Dtos;

public record CreateHabitRequest(string Name, IReadOnlyList<int>? ScheduledDays, HabitType Type = HabitType.Build);

public record UpdateHabitRequest(string Name, IReadOnlyList<int>? ScheduledDays, HabitType Type = HabitType.Build);

public record HabitResponse(
    Guid Id,
    Guid IdentityId,
    string Name,
    HabitType Type,
    IReadOnlyList<int> ScheduledDays,
    bool IsArchived,
    DateTime CreatedAt);
