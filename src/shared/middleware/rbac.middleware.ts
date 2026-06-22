import { Request, Response, NextFunction } from "express";
import { errorResponse } from "@/shared/utils/response";
import { UserRole } from "@/shared/enums";
import { Permission, hasPermission } from "@/shared/constants/permissions";
import { logger } from "@/config/logger";

/*
  Middleware that ensures the authenticated user has one of the specified roles.
  Admins (req.admin present) bypass this check.
*/
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.admin) {
      logger.debug("RBAC: Admin bypass for requireRole", {
        adminId: req.admin.id,
        requiredRoles: roles,
      });
      next();
      return;
    }

    if (!req.user) {
      errorResponse(res, "Authentication required", 401);
      return;
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      logger.warn("RBAC: Role check failed", {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
        method: req.method,
      });
      errorResponse(res, "Insufficient permissions", 403);
      return;
    }

    next();
  };
}

/*
  Middleware that ensures the authenticated user has all specified permissions.
  Admins bypass this check and are granted all permissions.
*/
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.admin) {
      logger.debug("RBAC: Admin bypass for requirePermission", {
        adminId: req.admin.id,
        requiredPermissions: permissions,
      });
      next();
      return;
    }

    if (!req.user) {
      errorResponse(res, "Authentication required", 401);
      return;
    }

    for (const permission of permissions) {
      if (!hasPermission(req.user.role, permission)) {
        logger.warn("RBAC: Permission denied", {
          userId: req.user.id,
          userRole: req.user.role,
          missingPermission: permission,
          path: req.path,
          method: req.method,
        });

        errorResponse(
          res,
          `Insufficient permissions: missing ${permission}`,
          403
        );
        return;
      }
    }

    logger.debug("RBAC: Permission granted", {
      userId: req.user.id,
      userRole: req.user.role,
      permissions,
      path: req.path,
    });

    next();
  };
}

/*
  Middleware that ensures company_admin users can only access their own company's data.
  Admins can access any company. Members cannot access company endpoints.
*/
export function requireCompanyAccess(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.admin) {
    next();
    return;
  }

  if (!req.user) {
    errorResponse(res, "Authentication required", 401);
    return;
  }

  if (req.user.role === UserRole.COMPANY_ADMIN) {
    const targetCompanyId =
      req.params.companyId || req.body.company_id || req.company?.id;

    if (targetCompanyId && targetCompanyId !== req.user.company_id) {
      logger.warn("RBAC: Cross-company access denied", {
        userId: req.user.id,
        userCompanyId: req.user.company_id,
        targetCompanyId,
        path: req.path,
      });
      errorResponse(res, "Forbidden: cannot access data from another company", 403);
      return;
    }
  }

  if (req.user.role === UserRole.MEMBER) {
    errorResponse(res, "Forbidden: only company admins can access this resource", 403);
    return;
  }

  next();
}

/*
  Middleware that ensures members can only access their own user record.
  Company admins and admins can access users within their scope.
*/
export function requireOwnUserAccess(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.admin) {
    next();
    return;
  }

  if (!req.user) {
    errorResponse(res, "Authentication required", 401);
    return;
  }

  const targetUserId = req.params.id;

  if (req.user.role === UserRole.MEMBER && targetUserId && targetUserId !== req.user.id) {
    logger.warn("RBAC: Cross-user access denied for member", {
      userId: req.user.id,
      targetUserId,
      path: req.path,
    });
    errorResponse(res, "Forbidden: can only access your own data", 403);
    return;
  }

  if (req.user.role === UserRole.COMPANY_ADMIN && targetUserId) {
    next();
    return;
  }

  next();
}

/*
  Middleware that logs permission checks for audit purposes.
  Tracks role-based access decisions with user context.
*/
export function permissionAuditLogger(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const actor = req.admin
    ? { type: "admin", id: req.admin.id, email: req.admin.email }
    : req.user
      ? { type: "user", id: req.user.id, role: req.user.role, companyId: req.user.company_id }
      : { type: "unauthenticated" };

  logger.info("RBAC: Access check", {
    actor,
    method: req.method,
    path: req.path,
    company: req.company
      ? { id: req.company.id, name: req.company.name }
      : null,
  });

  next();
}
