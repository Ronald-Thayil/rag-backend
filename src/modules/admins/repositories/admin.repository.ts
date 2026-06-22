import { Admin } from "@/modules/admins/admin.model";
import { CreateAdminDto, CreateCompanyAdminDto } from "@/modules/admins/dto/create-admin.dto";
import User from "@/modules/users/user.model";
import { UserRole } from "@/shared/enums";

export class AdminRepository {
  async create(dto: CreateAdminDto, passwordHash: string): Promise<Admin> {
    return Admin.create({
      email: dto.email,
      password_hash: passwordHash,
      first_name: dto.first_name || null,
      last_name: dto.last_name || null,
      is_active: dto.is_active ?? true,
    });
  }
  async createCompanyAdmin(dto: CreateCompanyAdminDto, passwordHash: string): Promise<User> {
    return User.create({
      email: dto.email,
      password_hash: passwordHash,
      first_name: dto.first_name || null,
      last_name: dto.last_name || null,
      is_active: dto.is_active ?? true,
      company_id: dto.company_id,
      role: UserRole.COMPANY_ADMIN,
    });
  }

  async findByEmail(email: string): Promise<Admin | null> {
    return Admin.findOne({ where: { email } });
  }
  async findCompanyAdminByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }

  async findById(id: string): Promise<Admin | null> {
    return Admin.findByPk(id, { attributes: { exclude: ["password_hash"] } });
  }
}
