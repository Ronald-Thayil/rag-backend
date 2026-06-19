import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JwtPayload } from "@/shared/utils/jwt";
import { errorResponse } from "@/shared/utils/response";
import { User } from "@/modules/users/user.model";
import { Admin } from "@/modules/admins/admin.model";

/*
  Authenticate: validates Bearer token from Authorization header.
  On success, loads the full user/admin record and attaches it to req.
*/
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    errorResponse(res, "Missing or invalid Authorization header", 401);
    return;
  }

  const token = header.slice(7);

  let payload: JwtPayload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    errorResponse(res, "Invalid or expired access token", 401);
    return;
  }

  try {
    if (payload.type === "admin") {
      const admin = await Admin.findByPk(payload.sub, {
        attributes: { exclude: ["password_hash"] },
      });
      if (!admin || !admin.is_active) {
        errorResponse(res, "Admin account not found or inactive", 401);
        return;
      }
      req.admin = admin;
    } else {
      const user = await User.findByPk(payload.sub, {
        attributes: { exclude: ["password_hash"] },
      });
      if (!user || !user.is_active) {
        errorResponse(res, "User account not found or inactive", 401);
        return;
      }
      req.user = user;
    }

    req.jwtPayload = payload;
    next();
  } catch (error) {
    next(error);
  }
}

/*
  Authorize: checks that the authenticated user has one of the allowed roles.
  Only applies to user-type (not admin). Admins bypass this check.
*/
export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.admin) {
      next();
      return;
    }

    if (!req.user) {
      errorResponse(res, "Authentication required", 401);
      return;
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      errorResponse(res, "Insufficient permissions", 403);
      return;
    }

    next();
  };
}

/*
  CSRF protection: requires X-Requested-With header for state-changing ops.
  This works because cross-origin requests from a browser cannot set this header
  without explicit CORS configuration.
*/
export function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }

  const requestedWith = req.headers["x-requested-with"];
  if (requestedWith !== "XMLHttpRequest") {
    errorResponse(res, "CSRF validation failed", 403);
    return;
  }

  next();
}
