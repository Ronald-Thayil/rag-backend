import { Request, Response, NextFunction } from "express";
import { UserService } from "@/modules/users/services/user.service";
import { PermissionService } from "@/services/permission.service";
import { successResponse } from "@/shared/utils/response";
import { ForbiddenError } from "@/shared/errors/app-error";
import { UserRole } from "@/shared/enums";
import { hashPassword } from "@/shared/utils/password";

export class UserController {
  private readonly permissionService: PermissionService;

  constructor(private readonly userService: UserService) {
    this.permissionService = new PermissionService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actor = req.admin || req.user;
      this.permissionService.requireCompanyAccess(actor, req.body.company_id);

      const createdBy = req.admin?.id || req.user?.id || undefined;
      const password_hash = hashPassword(req.body.password_hash);
      const user = await this.userService.createUser({ ...req.body, password_hash }, createdBy);
      successResponse(res, user, "User created successfully", 201);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.getUserById(req.params.id);
      const actor = req.admin || req.user;

      this.permissionService.requireOwnUserAccess(actor, user.id);
      this.permissionService.requireCompanyAccess(actor, user.company_id);

      successResponse(res, user);
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let companyId = req.company?.id;

      if (req.admin) {
        companyId = (req.query.company_id as string) || companyId;
      } else if (req.user) {
        if (req.user.role === UserRole.COMPANY_ADMIN) {
          companyId = req.user.company_id;
        } else {
          throw new ForbiddenError("Forbidden: cannot list all users");
        }
      }

      const users = await this.userService.getUsers(companyId);
      successResponse(res, users);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const target = await this.userService.getUserById(req.params.id);
      const actor = req.admin || req.user;

      this.permissionService.requireOwnUserAccess(actor, target.id);
      this.permissionService.requireCompanyAccess(actor, target.company_id);

      const updatedBy = req.admin?.id || req.user?.id || undefined;
      const user = await this.userService.updateUser(req.params.id, req.body, updatedBy);
      successResponse(res, user, "User updated successfully");
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const target = await this.userService.getUserById(req.params.id);
      const actor = req.admin || req.user;

      this.permissionService.requireOwnUserAccess(actor, target.id);
      this.permissionService.requireCompanyAccess(actor, target.company_id);

      await this.userService.deleteUser(req.params.id);
      successResponse(res, null, "User deleted successfully");
    } catch (error) {
      next(error);
    }
  };
}

export default UserController;
