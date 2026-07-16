using IdentityHabits.Api.Models;

namespace IdentityHabits.Api.Dtos;

public record UpsertHabitLogRequest(HabitLogStatus Status, string? Note);

public record HabitLogResponse(Guid Id, Guid HabitId, DateOnly CompletedOn, HabitLogStatus Status, string? Note);
