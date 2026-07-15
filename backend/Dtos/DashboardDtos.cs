using IdentityHabits.Api.Models;

namespace IdentityHabits.Api.Dtos;

public record TodayHabitResponse(
    Guid Id,
    string Name,
    FrequencyType FrequencyType,
    int TargetPerWeek,
    HabitLogStatus? TodayStatus);

public record TodayIdentityResponse(Guid Id, string Statement, List<TodayHabitResponse> Habits);
