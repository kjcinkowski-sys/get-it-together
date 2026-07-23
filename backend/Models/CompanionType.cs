namespace IdentityHabits.Api.Models;

/// <summary>
/// The kind of companion a user chose to represent an identity's progress. Each type draws
/// the same 0–4 growth stages differently. New types can be appended over time.
/// </summary>
public enum CompanionType
{
    /// <summary>The original abstract accent-coloured sprite (default for existing identities).</summary>
    Sprite,

    /// <summary>A seed that grows into a full tree with a little face.</summary>
    Tree,

    /// <summary>A curled-up kitten that grows into a proud cat.</summary>
    Cat,

    /// <summary>An egg that becomes a caterpillar and finally a butterfly.</summary>
    Butterfly,
}
