/**
 * Matching Engine
 * Ranks ELIGIBLE candidates.
 * ABSOLUTE RULE: Money cannot make an ineligible provider eligible.
 * Priority scores only reorder among candidates that already passed all deterministic gates.
 */
export function rankEligibleCandidates(eligibleEntries, request) {
  const scored = eligibleEntries.map(({ provider, distanceMiles, progressiveInquiry }) => {
    // 1. Proximity score (0.0 to 1.0)
    const maxRadius = provider.max_radius_miles || 25;
    const proximityScore = Math.max(0, 1 - (distanceMiles / maxRadius));

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
    }

    // 5. Paid Priority score (influence only, capped at 1.0)
    const paidPriorityScore = provider.priority_score || 0.0;

    // Weighted composite score:
    // Proximity: 35%
    // Reliability: 25%
    // Response Speed: 20%
    // Affinity: 10%
    // Paid Priority: 10%
    const finalScore =
      (0.35 * proximityScore) +
      (0.25 * reliabilityScore) +
      (0.20 * responseSpeedScore) +
      (0.10 * affinityScore) +
      (0.10 * paidPriorityScore);

    return {
      provider,
      distanceMiles,
      progressiveInquiry,
      scores: {
        proximity: parseFloat(proximityScore.toFixed(3)),
        reliability: parseFloat(reliabilityScore.toFixed(3)),
        responseSpeed: parseFloat(responseSpeedScore.toFixed(3)),
        affinity: parseFloat(affinityScore.toFixed(3)),
        paidPriority: parseFloat(paidPriorityScore.toFixed(3)),
        final: parseFloat(finalScore.toFixed(3))
      }
    };
  });

  // Sort descending by final score
  scored.sort((a, b) => b.scores.final - a.scores.final);

  return scored;
}
