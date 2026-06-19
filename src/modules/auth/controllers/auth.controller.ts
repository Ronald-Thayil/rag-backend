import { Request, Response, NextFunction } from "express";
import { AuthService } from "@/modules/auth/services/auth.service";
import { successResponse, errorResponse } from "@/shared/utils/response";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      if (!result) {
        errorResponse(res, "Invalid credentials", 401);
        return;
      }
      successResponse(res, result, "Login successful");
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
