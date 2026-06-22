import { UserRole } from "@/shared/enums";

export const Permissions = {
  USERS_READ: "users:read",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",
  COMPANIES_READ: "companies:read",
  COMPANIES_CREATE: "companies:create",
  COMPANIES_UPDATE: "companies:update",
  COMPANIES_DELETE: "companies:delete",
  DOCUMENTS_QUERY: "documents:query",
  DOCUMENTS_UPLOAD: "documents:upload",
  DOCUMENTS_DELETE: "documents:delete",
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

const RolePermissionMap: Record<string, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permissions),
  [UserRole.COMPANY_ADMIN]: [
    Permissions.USERS_READ,
    Permissions.USERS_CREATE,
    Permissions.USERS_UPDATE,
    Permissions.USERS_DELETE,
    Permissions.DOCUMENTS_QUERY,
    Permissions.DOCUMENTS_UPLOAD,
    Permissions.DOCUMENTS_DELETE,
  ],
  [UserRole.MEMBER]: [
    Permissions.DOCUMENTS_QUERY,
    Permissions.USERS_READ,
  ],
};

export function getPermissionsForRole(role: string): Permission[] {
  return RolePermissionMap[role] ?? [];
}

export function hasPermission(role: string, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission);
}
