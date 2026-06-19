import { Request, Response, NextFunction } from "express";
import { UserService } from "@/modules/users/services/user.service";
import { successResponse } from "@/shared/utils/response";

export class UserController {
  constructor(private readonly userService: UserService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.createUser(req.body, req.user?.id);
      successResponse(res, user, "User created successfully", 201);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.getUserById(req.params.id);
      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.company?.id;
      const users = await this.userService.getUsers(companyId);
      successResponse(res, users);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.updateUser(req.params.id, req.body, req.user?.id);
      successResponse(res, user, "User updated successfully");
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.userService.deleteUser(req.params.id);
      successResponse(res, null, "User deleted successfully");
    } catch (error) {
      next(error);
    }
  };
}

export default UserController;
