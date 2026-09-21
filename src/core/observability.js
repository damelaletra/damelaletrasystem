import { db } from "./db.js";

/**
 * Observability & Demand Intelligence Engine
 * North Star Metric: TIME TO CONNECTION (TTC)
 */
export function getObservabilityMetrics() {
  const requests = db.getRequests();
  const eventLogs = db.getEventLogs();
  const providers = db.getProviders();

  // 1. Time to Connection (North Star Metric)
  const completedRequests = requests.filter(r => r.status === "CONNECTED" && r.completed_at);
  let totalConnectionTimeSec = 0;

  for (const r of completedRequests) {
    const start = new Date(r.created_at).getTime();
    const end = new Date(r.completed_at).getTime();
    const diffSec = Math.max(1, Math.round((end - start) / 1000));
    totalConnectionTimeSec += diffSec;
  }

  const avgTimeToConnectionSec = completedRequests.length > 0
    ? Math.round(totalConnectionTimeSec / completedRequests.length)
    : 0;

  // 2. Volume & Funnel KPIs
  const totalRequests = requests.length;
  const connectedCount = completedRequests.length;
  const withQuotes = requests.filter(r => r.quoted_price !== null).length;
  const quoteAcceptanceRate = withQuotes > 0
    ? parseFloat(((connectedCount / withQuotes) * 100).toFixed(1))
    : 0;

  // 3. Demand Intelligence: By Category
  const categoryDemand = {};
  for (const r of requests) {
    const cat = r.service_category || "UNCATEGORIZED";
    categoryDemand[cat] = (categoryDemand[cat] || 0) + 1;
  }

  // 4. Demand Intelligence: By Location in Louisville
  const locationDemand = {};
  for (const r of requests) {
    const loc = r.location_raw || "Louisville Metro";
    locationDemand[loc] = (locationDemand[loc] || 0) + 1;
  }

  // 5. Unserved Demand Gaps (Opportunities for network recruitment)
  const unservedRequests = requests.filter(r => r.status === "NO_PROVIDER" || r.status === "EXTERNAL_FALLBACK_OFFERED");
  const unservedGaps = {};
  for (const r of unservedRequests) {
    const cat = r.service_category || "UNCATEGORIZED";
    unservedGaps[cat] = (unservedGaps[cat] || 0) + 1;
  }

  return {
    northStar: {
      metric: "Time to Connection (TTC)",
      averageSeconds: avgTimeToConnectionSec,
      targetSeconds: 180,
      completedConnections: connectedCount
    },
    funnel: {
      totalRequests,
      withQuotes,
      connectedCount,
      quoteAcceptanceRate: `${quoteAcceptanceRate}%`,
      activeProviders: providers.filter(p => p.availability_status === "AVAILABLE").length,
      totalProviders: providers.length
    },
    demandIntelligence: {
      byCategory: categoryDemand,
      byLocation: locationDemand,
      unservedGaps: unservedGaps
    }
  };
}
