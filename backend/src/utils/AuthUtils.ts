import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { env } from "../config/env";
import { Role } from "../constants/roles";

interface TokenPayload {
  id: string;
  role: Role;
  isActive: boolean;
}

export class AuthUtils {
  /**
   * Generate Access and Refresh JWT tokens
   * @param payload User data to include in token
   */
  public static generateTokens(payload: TokenPayload) {
    const accessToken = jwt.sign(payload, env.JWT_SESSION_SECRET, {
      expiresIn: env.JWT_SESSION_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verify a JWT token
   * @param token JWT token string
   */
  public static verifyToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_SESSION_SECRET) as TokenPayload;
  }

  /**
   * Verify a refresh JWT token
   * @param token JWT token string
   */
  public static verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
  }

  /**
   * Hash a plain text password
   * @param password Plain text password
   */
  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  }

  /**
   * Compare a plain text password with a hashed password
   * @param password Plain text password
   * @param hash Hashed password
   */
  public static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
