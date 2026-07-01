import { User } from "@/modules/users/user.model";
import { CreateUserDto } from "@/modules/users/dto/create-user.dto";
import { UpdateUserDto } from "@/modules/users/dto/update-user.dto";
import { NotFoundError } from "@/shared/errors/app-error";
import { PaginationOptions } from "@/shared/interfaces";

export class UserRepository {
  async create(dto: CreateUserDto, userId?: string): Promise<User> {
    return User.create({
      ...dto,
      created_by: userId || null,
      updated_by: userId || null,
    });
  }

  async findById(id: string): Promise<User | null> {
    return User.findByPk(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }

  async findAll(
    companyId?: string,
    options?: PaginationOptions
  ): Promise<{ rows: User[]; count: number }> {
    const where = companyId ? { company_id: companyId } : {};
    if (options) {
      return User.findAndCountAll({
        where,
        limit: options.limit,
        offset: options.offset,
        order: [["created_at", "DESC"]],
      });
    }
    const rows = await User.findAll({ where, order: [["created_at", "DESC"]] });
    return { rows, count: rows.length };
  }

  async update(id: string, dto: UpdateUserDto, userId?: string): Promise<User> {
    const user = await User.findByPk(id);
    if (!user) throw new NotFoundError("User not found");
    await user.update({ ...dto, updated_by: userId || null });
    return user.reload();
  }

  async delete(id: string): Promise<void> {
    const user = await User.findByPk(id);
    if (!user) throw new NotFoundError("User not found");
    await user.destroy();
  }
}

export default UserRepository;
