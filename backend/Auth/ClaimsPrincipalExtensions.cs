using System.Security.Claims;

namespace IdentityHabits.Api.Auth;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("Request is missing the expected NameIdentifier claim.");
        return Guid.Parse(value);
    }
}
