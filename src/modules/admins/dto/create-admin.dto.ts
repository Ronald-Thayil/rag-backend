export interface CreateAdminDto {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}

export interface CreateCompanyAdminDto {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  company_id: string;
}
