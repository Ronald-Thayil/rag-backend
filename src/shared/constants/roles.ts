import { UserRole } from "@/shared/enums";

export const ROLES = {
  [UserRole.ADMIN]: {
    name: "Admin",
    description: "Platform-level administrator with full access",
    level: 3,
  },
  [UserRole.COMPANY_ADMIN]: {
    name: "Company Admin",
    description: "Manages users and documents within their own company",
    level: 2,
  },
  [UserRole.MEMBER]: {
    name: "Member",
    description: "Standard user with read/query access to the RAG system",
    level: 1,
  },
} as const;

export function roleAtLeast(role: string, minimumLevel: number): boolean {
  const entry = Object.entries(ROLES).find(([key]) => key === role);
  return entry ? entry[1].level >= minimumLevel : false;
}
