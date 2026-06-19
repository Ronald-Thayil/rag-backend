export interface CreateUserDto {
  company_id: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  is_active?: boolean;
}
