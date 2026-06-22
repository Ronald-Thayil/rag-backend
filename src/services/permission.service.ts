import { Admin } from "@/modules/admins/admin.model";
import { User } from "@/modules/users/user.model";
import { UserRole } from "@/shared/enums";
import { Permission, hasPermission } from "@/shared/constants/permissions";
import { ForbiddenError, UnauthorizedError } from "@/shared/errors/app-error";

function isUser(actor: Admin | User): actor is User {
  return "role" in actor;
}

export class PermissionService {
  requirePermission(actor: Admin | User | undefined, permission: Permission): void {
    if (!actor) {
      throw new UnauthorizedError("Authentication required");
    }

    if (!isUser(actor)) {
      return;
    }

    if (!hasPermission(actor.role, permission)) {
      throw new ForbiddenError(
        `Insufficient permissions: missing ${permission}`
      );
    }
  }

  requireCompanyAccess(
    actor: Admin | User | undefined,
    targetCompanyId: string
  ): void {
    if (!actor) {
      throw new UnauthorizedError("Authentication required");
    }

    if (!isUser(actor)) {
      return;
    }

    const user = actor as User;

    if (user.role === UserRole.MEMBER) {
      throw new ForbiddenError("Members cannot access company-level resources");
    }

    if (user.role === UserRole.COMPANY_ADMIN && user.company_id !== targetCompanyId) {
      throw new ForbiddenError(
        "Forbidden: cannot access data from another company"
      );
    }
  }

  requireOwnUserAccess(
    actor: Admin | User | undefined,
    targetUserId: string
  ): void {
    if (!actor) {
      throw new UnauthorizedError("Authentication required");
    }

    if (!isUser(actor)) {
      return;
    }

    const user = actor as User;

    if (user.role === UserRole.MEMBER && user.id !== targetUserId) {
      throw new ForbiddenError("Forbidden: can only access your own data");
    }
  }

  canManageUser(actor: Admin | User | undefined, targetUser: User): boolean {
    if (!actor) return false;

    if (!isUser(actor)) return true;

    const user = actor as User;

    if (user.role === UserRole.MEMBER) return false;

    if (
      user.role === UserRole.COMPANY_ADMIN &&
      user.company_id === targetUser.company_id
    ) {
      return true;
    }

    return false;
  }
}
