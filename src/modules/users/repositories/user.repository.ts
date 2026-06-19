import { User } from "@/modules/users/user.model";
import { CreateUserDto } from "@/modules/users/dto/create-user.dto";
import { UpdateUserDto } from "@/modules/users/dto/update-user.dto";
import { NotFoundError } from "@/shared/errors/app-error";

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

  async findAll(companyId?: string): Promise<User[]> {
    const where = companyId ? { company_id: companyId } : {};
    return User.findAll({ where });
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
