import { User } from "@/modules/users/user.model";
import { CreateUserDto } from "@/modules/users/dto/create-user.dto";
import { UpdateUserDto } from "@/modules/users/dto/update-user.dto";
import { NotFoundError } from "@/shared/errors/app-error";
import { FindOptions } from "sequelize";

export class UserRepository {
  async create(dto: CreateUserDto, userId?: string): Promise<User> {
    return User.create({
      ...dto,
      created_by: userId || null,
      updated_by: userId || null,
    });
  }

  async findById(id: string): Promise<User | null> {
    return User.findByPk(id, { paranoid: false });
  }

  async findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email }, paranoid: false });
  }

  async findAll(options?: FindOptions): Promise<User[]> {
    return User.findAll({ paranoid: false, ...options });
  }

  async update(id: string, dto: UpdateUserDto, userId?: string): Promise<User> {
    const user = await User.findByPk(id);
    if (!user) throw new NotFoundError("User not found");
    await user.update({ ...dto, updated_by: userId || null });
    return user.reload();
  }

  async softDelete(id: string, userId?: string): Promise<void> {
    const user = await User.findByPk(id);
    if (!user) throw new NotFoundError("User not found");
    await user.destroy();
    await user.update({ deleted_by: userId || null });
  }
}

export default UserRepository;
