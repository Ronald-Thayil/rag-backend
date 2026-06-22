import { AdminRepository } from "@/modules/admins/repositories/admin.repository";
import { CreateAdminDto, CreateCompanyAdminDto } from "@/modules/admins/dto/create-admin.dto";
import { Admin } from "@/modules/admins/admin.model";
import { hashPassword } from "@/shared/utils/password";
import { ConflictError } from "@/shared/errors/app-error";
import User from "@/modules/users/user.model";

export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) { }

  async createAdmin(dto: CreateAdminDto): Promise<Admin> {
    const existing = await this.adminRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError("Admin with this email already exists");
    }

    const passwordHash = await hashPassword(dto.password);
    return this.adminRepository.create(dto, passwordHash);
  }

  async createCompanyAdmin(dto: CreateCompanyAdminDto): Promise<User> {
    const existing = await this.adminRepository.findCompanyAdminByEmail(dto.email);
    if (existing) {
      throw new ConflictError("Admin with this email already exists");
    }

    const passwordHash = await hashPassword(dto.password);
    return this.adminRepository.createCompanyAdmin(dto, passwordHash);
  }
}
