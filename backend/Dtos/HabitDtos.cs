using IdentityHabits.Api.Models;

namespace IdentityHabits.Api.Dtos;

public record CreateHabitRequest(string Name, FrequencyType FrequencyType, int TargetPerWeek);

public record UpdateHabitRequest(string Name, FrequencyType FrequencyType, int TargetPerWeek);

public record HabitResponse(
    Guid Id,
    Guid IdentityId,
    string Name,
    FrequencyType FrequencyType,
    int TargetPerWeek,
    bool IsArchived,
    DateTime CreatedAt);
