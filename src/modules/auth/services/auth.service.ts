import { AuthRepository } from "@/modules/auth/repositories/auth.repository";
import { UserRepository } from "@/modules/users/repositories/user.repository";
import { Admin } from "@/modules/admins/admin.model";
import { User } from "@/modules/users/user.model";
import { verifyPassword } from "@/shared/utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  JwtPayload,
} from "@/shared/utils/jwt";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { UnauthorizedError, NotFoundError } from "@/shared/errors/app-error";

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userRepository: UserRepository
  ) { }

  // ── User Login ────────────────────────────────────────────
  async loginUser(
    email: string,
    password: string,
    ip: string
  ): Promise<TokenPair & { user: User }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.is_active) {
      logger.warn(`Failed user login attempt for ${email} from ${ip}`);
      throw new UnauthorizedError("Invalid credentials");
    }

    const valid = await verifyPassword(user.password_hash, password);
    if (!valid) {
      logger.warn(`Failed user login attempt for ${email} from ${ip}`);
      throw new UnauthorizedError("Invalid credentials");
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      type: "user",
      company_id: user.company_id,
      role: user.role,
    });

    await user.update({ last_login_at: new Date() });
    logger.info(`User login success: ${email} (${user.id}) from ${ip}`);

    return { ...tokens, user };
  }

  // ── Admin Login ───────────────────────────────────────────
  async loginAdmin(
    email: string,
    password: string,
    ip: string
  ): Promise<TokenPair & { user: Admin }> {
    const admin = await Admin.findOne({ where: { email } });
    if (!admin || !admin.is_active) {
      logger.warn(`Failed admin login attempt for ${email} from ${ip}`);
      throw new UnauthorizedError("Invalid credentials");
    }

    const valid = await verifyPassword(admin.password_hash, password);
    if (!valid) {
      logger.warn(`Failed admin login attempt for ${email} from ${ip}`);
      throw new UnauthorizedError("Invalid credentials");
    }

    const tokens = await this.generateTokens({
      sub: admin.id,
      type: "admin",
    });

    await admin.update({ last_login_at: new Date() });
    logger.info(`Admin login success: ${email} (${admin.id}) from ${ip}`);

    return { ...tokens, user: admin };
  }

  // ── Admin Impersonation (Login as User) ────────────────────
  async loginAsUser(
    userId: string,
    impersonatorId: string
  ): Promise<TokenPair & { user: User }> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.is_active) {
      logger.warn(`Impersonation failed: user ${userId} not found or inactive by admin ${impersonatorId}`);
      throw new NotFoundError("User not found or inactive");
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      type: "user",
      company_id: user.company_id,
      role: user.role,
    });

    await user.update({ last_login_at: new Date() });
    logger.info(`Admin ${impersonatorId} impersonated user ${user.email} (${user.id})`);

    const { password_hash: _, ...safeUser } = user.toJSON();
    return { ...tokens, user: safeUser as unknown as User };
  }

  // ── Token Refresh with Rotation ───────────────────────────
  async refreshTokens(rawRefreshToken: string): Promise<TokenPair> {
    let payload: JwtPayload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const stored = await this.authRepository.findByToken(rawRefreshToken);
    if (!stored || stored.revoked) {
      // Token reuse detected — revoke all tokens for this subject
      if (stored?.revoked) {
        await this.authRepository.revokeAllForUser(
          stored.subject_id,
          stored.subject_type
        );
        logger.warn(
          `Refresh token reuse detected for ${stored.subject_type} ${stored.subject_id}`
        );
      }
      throw new UnauthorizedError("Invalid refresh token");
    }

    if (new Date() > stored.expires_at) {
      throw new UnauthorizedError("Refresh token expired");
    }

    // Revoke the used token (rotation)
    await this.authRepository.revokeToken(rawRefreshToken);

    // Verify subject still exists and is active
    await this.verifySubjectActive(payload.sub, payload.type);

    const tokens = await this.generateTokens(payload);
    logger.info(`Token refreshed for ${payload.type} ${payload.sub}`);

    return tokens;
  }

  // ── Logout ────────────────────────────────────────────────
  async logout(rawRefreshToken: string): Promise<void> {
    if (!rawRefreshToken) return;
    try {
      const payload = verifyRefreshToken(rawRefreshToken);
      await this.authRepository.revokeToken(rawRefreshToken);
      logger.info(`Logout for ${payload.type} ${payload.sub}`);
    } catch {
      // Token already invalid — nothing to do
    }
  }

  // ── Token Generation (private) ────────────────────────────
  private async generateTokens(
    payload: JwtPayload
  ): Promise<TokenPair> {
    const access_token = signAccessToken(payload);

    const expiresAt = new Date(
      Date.now() + env.JWT_REFRESH_EXPIRES_IN * 1000
    );
    const { raw } = await this.authRepository.createRefreshToken(
      payload.sub,
      payload.type,
      expiresAt
    );

    return {
      access_token,
      refresh_token: raw,
    };
  }

  // ── Subject Validation ────────────────────────────────────
  private async verifySubjectActive(
    sub: string,
    type: string
  ): Promise<void> {
    if (type === "admin") {
      const admin = await Admin.findByPk(sub);
      if (!admin || !admin.is_active) {
        throw new UnauthorizedError("Account deactivated");
      }
    } else {
      const user = await User.findByPk(sub);
      if (!user || !user.is_active) {
        throw new UnauthorizedError("Account deactivated");
      }
    }
  }
}

export default AuthService;
