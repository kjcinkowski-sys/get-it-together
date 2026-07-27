using IdentityHabits.Api.Models;

namespace IdentityHabits.Api.Dtos;

public record StatsHabitResponse(
    Guid Id,
    string Name,
    HabitType Type,
    IReadOnlyList<int> ScheduledDays,
    int CurrentStreak,
    int LongestStreak,
    int TotalCompletions,
    int CompletionRate);

public record StatsIdentityResponse(
    Guid Id,
    string Statement,
    CompanionType Companion,
    int Stage,
    string StageName,
    int StageProgress,
    int StreakDays,
    List<StatsHabitResponse> Habits);
