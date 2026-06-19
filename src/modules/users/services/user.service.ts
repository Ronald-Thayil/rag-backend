import { UserRepository } from "@/modules/users/repositories/user.repository";
import { CreateUserDto } from "@/modules/users/dto/create-user.dto";
import { UpdateUserDto } from "@/modules/users/dto/update-user.dto";
import { User } from "@/modules/users/user.model";
import { ConflictError, NotFoundError } from "@/shared/errors/app-error";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(dto: CreateUserDto, userId?: string): Promise<User> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) throw new ConflictError("User with this email already exists");
    return this.userRepository.create(dto, userId);
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");
    return user;
  }

  async getUsers(companyId?: string): Promise<User[]> {
    return this.userRepository.findAll(companyId);
  }

  async updateUser(id: string, dto: UpdateUserDto, userId?: string): Promise<User> {
    if (dto.email) {
      const existing = await this.userRepository.findByEmail(dto.email);
      if (existing && existing.id !== id) {
        throw new ConflictError("User with this email already exists");
      }
    }
    return this.userRepository.update(id, dto, userId);
  }

  async deleteUser(id: string): Promise<void> {
    await this.getUserById(id);
    return this.userRepository.delete(id);
  }
}

export default UserService;
