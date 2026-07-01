import { Request, Response, NextFunction } from "express";
import { AuthService } from "@/modules/auth/services/auth.service";
import { successResponse } from "@/shared/utils/response";
import { env } from "@/config/env";

const REFRESH_COOKIE = "refresh_token";

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "strict",
    domain: env.COOKIE_DOMAIN || undefined,
    path: "/api/v1/auth",
    maxAge: env.JWT_REFRESH_EXPIRES_IN * 1000,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "strict",
    path: "/api/v1/auth",
  });
}

export class AuthController {
  constructor(private readonly authService: AuthService) { }

  loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const tokens = await this.authService.loginUser(email, password, ip);
      setRefreshCookie(res, tokens.refresh_token);
      successResponse(res, { access_token: tokens.access_token, user: tokens.user }, "Login successful");
    } catch (error) {
      next(error);
    }
  };

  loginAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const tokens = await this.authService.loginAdmin(email, password, ip);
      setRefreshCookie(res, tokens.refresh_token);
      successResponse(res, { access_token: tokens.access_token, user: tokens.user }, "Admin login successful");
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const raw = req.cookies?.[REFRESH_COOKIE];
      if (!raw) {
        res.status(401).json({ success: false, message: "No refresh token", data: null });
        return;
      }
      const tokens = await this.authService.refreshTokens(raw);
      setRefreshCookie(res, tokens.refresh_token);
      successResponse(res, { access_token: tokens.access_token }, "Token refreshed");
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const raw = req.cookies?.[REFRESH_COOKIE];
      if (raw) {
        await this.authService.logout(raw);
      }
      clearRefreshCookie(res);
      successResponse(res, null, "Logged out successfully");
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
