/**
 * Matching Engine
 * Ranks ELIGIBLE candidates.
 * ABSOLUTE RULE: Money cannot make an ineligible provider eligible.
 * Priority scores only reorder among candidates that already passed all deterministic gates.
 */
export function rankEligibleCandidates(eligibleEntries, request) {
  const isDigitalOrRemote = request.service_category === "TECH_SOFTWARE" || 
                            request.service_category === "CONSULTING_PROFESSIONAL" ||
                            request.service_category === "LEGAL_SERVICES";

  const scored = eligibleEntries.map(({ provider, distanceMiles, progressiveInquiry }) => {
    // 1. Proximity score (0.0 to 1.0)
    const maxRadius = provider.max_radius_miles || 25;
    const proximityScore = isDigitalOrRemote ? 1.0 : Math.max(0, 1 - (distanceMiles / maxRadius));

    // 2. Reliability score (0.0 to 1.0)
    const reliabilityScore = provider.reliability_score || 0.9;

    // 3. Response speed score (faster = higher)
    // 30s -> ~1.0, 120s -> ~0.7, 300s -> ~0.3
    const avgResponseSec = provider.avg_response_time_sec || 60;
    const responseSpeedScore = Math.max(0.2, 1 - (avgResponseSec / 300));

    // 4. Service affinity score
    let affinityScore = 0.8;
    if (provider.services && provider.services.includes(request.service_type)) {
      affinityScore = 1.0;
    } else if (provider.legal_specialties && request.legal_specialty) {
      if (provider.legal_specialties.includes(request.legal_specialty) || provider.legal_specialties.includes("GENERAL_PRACTICE")) {
        affinityScore = 1.0;
      }
    }

    // 5. Commercial Queue Tier (Fila 1: Titulares/Pro vs Fila 2: Free Launch / Top-up)
    // Quality/SLA gates already passed in eligibility.js.
    // Within each queue tier, ranking is 100% by merit (Proximity 40%, Reliability 30%, Speed 20%, Affinity 10%).
    const isTitularTier =
      provider.subscription_tier === "TITULAR" ||
      provider.subscription_tier === "PRO" ||
      provider.subscription_tier === "FOUNDING" ||
      provider.subscription_tier === "UNLIMITED";
    const queueTier = isTitularTier ? 1 : 2;

    const finalScore =
      (0.40 * proximityScore) +
      (0.30 * reliabilityScore) +
      (0.20 * responseSpeedScore) +
      (0.10 * affinityScore);

    return {
      provider,
      distanceMiles,
      progressiveInquiry,
      queueTier,
      scores: {
        proximity: parseFloat(proximityScore.toFixed(3)),
        reliability: parseFloat(reliabilityScore.toFixed(3)),
        responseSpeed: parseFloat(responseSpeedScore.toFixed(3)),
        affinity: parseFloat(affinityScore.toFixed(3)),
        queueTier,
        final: parseFloat(finalScore.toFixed(3))
      }
    };
  });

  // Sort by Queue Tier first (Fila 1 Titulares -> Fila 2 Free/Desborde), then descending by pure merit score
  scored.sort((a, b) => {
    if (a.queueTier !== b.queueTier) {
      return a.queueTier - b.queueTier;
    }
    return b.scores.final - a.scores.final;
  });

  return scored;
}
