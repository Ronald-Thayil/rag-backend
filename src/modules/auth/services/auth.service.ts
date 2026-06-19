import { UserRepository } from "@/modules/users/repositories/user.repository";

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async login(email: string, _password: string): Promise<{ token: string } | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return null;
    // TODO: Implement password verification and JWT token generation
    return null;
  }
}

export default AuthService;
