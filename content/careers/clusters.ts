import type { CareerCluster } from "../types";
import { SPEC } from "../provenance";

/**
 * The 12 approved career clusters. Display order = array order.
 * `legacyIndex` / `legacyDirectionId` keep prototype links (#career-N, v1
 * journeys) working: each prototype cluster opens its replacement direction.
 */
export const careerClusters: CareerCluster[] = [
  { id: "ai-digital-transformation", label: "AI & Digital Transformation", icon: "brain", legacyIndex: 0, legacyDirectionId: "digital-transformation-manager", provenance: SPEC },
  { id: "analytics-business-intelligence", label: "Analytics & Business Intelligence", icon: "chart", legacyIndex: 1, legacyDirectionId: "business-intelligence", provenance: SPEC },
  { id: "strategy-consulting", label: "Strategy & Consulting", icon: "compass", legacyIndex: 2, legacyDirectionId: "management-consultant", provenance: SPEC },
  { id: "management-leadership", label: "Management & Leadership", icon: "building", legacyIndex: 3, legacyDirectionId: "general-manager", provenance: SPEC },
  { id: "marketing-customer", label: "Marketing & Customer", icon: "megaphone", legacyIndex: 4, legacyDirectionId: "marketing-specialist", provenance: SPEC },
  { id: "finance-commercial", label: "Finance & Commercial", icon: "landmark", legacyIndex: 5, legacyDirectionId: "commercial-manager", provenance: SPEC },
  { id: "health-management", label: "Health Management", icon: "heart-pulse", legacyIndex: 6, legacyDirectionId: "health-services-manager", provenance: SPEC },
  { id: "people-hr", label: "People & HR", icon: "users", legacyIndex: 7, legacyDirectionId: "people-culture-manager", provenance: SPEC },
  { id: "international-business", label: "International Business & Growth", icon: "globe", legacyIndex: 8, legacyDirectionId: "international-business-development", provenance: SPEC },
  { id: "social-impact-sustainability", label: "Social Impact, Public Sector & Sustainability", icon: "leaf", legacyIndex: 9, legacyDirectionId: "environment-sustainability-manager", provenance: SPEC },
  { id: "innovation-entrepreneurship", label: "Innovation & Entrepreneurship", icon: "lightbulb", legacyIndex: 10, legacyDirectionId: "innovation-manager", provenance: SPEC },
  { id: "operations-industry", label: "Operations & Industry", icon: "settings", legacyIndex: 11, legacyDirectionId: "operations-manager", provenance: SPEC },
];
