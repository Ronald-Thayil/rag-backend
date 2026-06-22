import crypto from "crypto";
import { RefreshToken } from "@/modules/auth/refresh-token.model";

export class AuthRepository {
  async createRefreshToken(
    subjectId: string,
    subjectType: string,
    expiresAt: Date
  ): Promise<{ raw: string; token: RefreshToken }> {
    const raw = crypto.randomUUID();
    const token_hash = crypto.createHash("sha256").update(raw).digest("hex");

    const token = await RefreshToken.create({
      token_hash,
      subject_id: subjectId,
      subject_type: subjectType,
      expires_at: expiresAt,
      created_at: new Date(),

    });

    return { raw, token };
  }

  async findByToken(raw: string): Promise<RefreshToken | null> {
    const token_hash = crypto.createHash("sha256").update(raw).digest("hex");
    return RefreshToken.findOne({ where: { token_hash } });
  }

  async revokeToken(raw: string): Promise<void> {
    const token_hash = crypto.createHash("sha256").update(raw).digest("hex");
    await RefreshToken.update({ revoked: true }, { where: { token_hash } });
  }

  async revokeAllForUser(subjectId: string, subjectType: string): Promise<void> {
    await RefreshToken.update(
      { revoked: true },
      { where: { subject_id: subjectId, subject_type: subjectType, revoked: false } }
    );
  }
}

export default AuthRepository;
