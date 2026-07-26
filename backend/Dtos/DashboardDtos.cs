using IdentityHabits.Api.Models;

namespace IdentityHabits.Api.Dtos;

public record TodayHabitResponse(
    Guid Id,
    string Name,
    IReadOnlyList<int> ScheduledDays,
    int CurrentStreak,
    HabitLogStatus? Status);

public record TodayIdentityResponse(
    Guid Id,
    string Statement,
    CompanionType Companion,
    int Stage,
    string StageName,
    int StageProgress,
    int StreakDays,
    List<TodayHabitResponse> Habits);
