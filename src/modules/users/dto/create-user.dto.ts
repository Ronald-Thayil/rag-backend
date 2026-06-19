export interface CreateUserDto {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  tenant_id: string;
  password_hash?: string;
}
