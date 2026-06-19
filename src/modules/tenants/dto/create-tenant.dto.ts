export interface CreateTenantDto {
  name: string;
  slug: string;
  is_active?: boolean;
}
