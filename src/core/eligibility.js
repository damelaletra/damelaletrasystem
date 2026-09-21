import { calculateDistanceMiles } from "./semantic.js";

/**
 * Deterministic Eligibility Engine
 * Hard gates that disqualify incompatible candidates before matching or contacting.
 */
export function checkProviderEligibility(provider, request) {
  // Gate 1: Category / Service affinity
  const categoryMatches = provider.category === request.service_category;
  const serviceMatches = provider.services && provider.services.includes(request.service_type);

  if (!categoryMatches && !serviceMatches) {
    return {
      eligible: false,
      reason: "CATEGORY_MISMATCH",
      details: `Provider category (${provider.category}) does not match request (${request.service_category})`
    };
  }

  // Gate 2: Property type compatibility
  // Golden Rule: UNKNOWN != NO
  // -1 = Unknown, 0 = No, 1 = Yes
  if (request.property_type === "COMMERCIAL") {
    if (provider.commercial_capable === 0) {
      return {
        eligible: false,
        reason: "RESIDENTIAL_ONLY",
        details: "Provider only handles residential properties"
      };
    }
  }

  if (request.property_type === "RESIDENTIAL") {
    if (provider.residential_capable === 0) {
      return {
        eligible: false,
        reason: "COMMERCIAL_ONLY",
        details: "Provider only handles commercial properties"
      };
    }
  }

  // Gate 3: Geographic radius
  const distance = calculateDistanceMiles(
    request.latitude,
    request.longitude,
    provider.base_latitude,
    provider.base_longitude
  );

  if (distance > provider.max_radius_miles) {
    return {
      eligible: false,
      reason: "OUT_OF_SERVICE_RADIUS",
      details: `Distance (${distance} mi) exceeds provider max radius (${provider.max_radius_miles} mi)`
    };
  }

  // Gate 4: Capacity and operational status
  if (provider.availability_status !== "AVAILABLE") {
    return {
      eligible: false,
      reason: "PROVIDER_UNAVAILABLE",
      details: `Status is ${provider.availability_status}`
    };
  }

  if (provider.capacity_used_today >= provider.capacity_today) {
    return {
      eligible: false,
      reason: "CAPACITY_EXHAUSTED",
      details: `Daily capacity reached (${provider.capacity_used_today}/${provider.capacity_today})`
    };
  }

  // Gate 5: Licensing validation
  if (provider.license_status === "EXPIRED") {
    return {
      eligible: false,
      reason: "LICENSE_EXPIRED",
      details: "Provider license is expired"
    };
  }

  // Progressive profile learning hook:
  // If property is commercial and provider commercial_capable is UNKNOWN (-1)
  let progressiveInquiry = null;
  if (request.property_type === "COMMERCIAL" && provider.commercial_capable === -1) {
    progressiveInquiry = {
      type: "CONFIRM_COMMERCIAL",
      question: `Hola ${provider.name}, tenemos un trabajo en un local comercial/oficina. ¿Atiendes comercial?`
    };
  }

  return {
    eligible: true,
    distanceMiles: distance,
    progressiveInquiry: progressiveInquiry
  };
}

export function filterEligibleProviders(allProviders, request) {
  const eligible = [];
  const disqualified = [];

  for (const provider of allProviders) {
    const result = checkProviderEligibility(provider, request);
    if (result.eligible) {
      eligible.push({
        provider,
        distanceMiles: result.distanceMiles,
        progressiveInquiry: result.progressiveInquiry
      });
    } else {
      disqualified.push({
        providerId: provider.id,
        name: provider.name,
        reason: result.reason,
        details: result.details
      });
    }
  }

  return { eligible, disqualified };
}
