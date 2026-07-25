using IdentityHabits.Api.Models;

namespace IdentityHabits.Api.Dtos;

public record CreateHabitRequest(
    string Name,
    FrequencyType FrequencyType,
    int TargetPerWeek,
    IReadOnlyList<int>? ScheduledDays);

public record UpdateHabitRequest(
    string Name,
    FrequencyType FrequencyType,
    int TargetPerWeek,
    IReadOnlyList<int>? ScheduledDays);

public record HabitResponse(
    Guid Id,
    Guid IdentityId,
    string Name,
    FrequencyType FrequencyType,
    int TargetPerWeek,
    IReadOnlyList<int> ScheduledDays,
    bool IsArchived,
    DateTime CreatedAt);
