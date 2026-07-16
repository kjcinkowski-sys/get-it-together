namespace IdentityHabits.Api.Dtos;

public record CreateIdentityRequest(string Statement);

public record UpdateIdentityRequest(string Statement);

public record IdentityResponse(Guid Id, string Statement, bool IsArchived, DateTime CreatedAt);
