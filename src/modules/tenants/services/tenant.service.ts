import { TenantRepository } from "@/modules/tenants/repositories/tenant.repository";
import { CreateTenantDto } from "@/modules/tenants/dto/create-tenant.dto";
import { UpdateTenantDto } from "@/modules/tenants/dto/update-tenant.dto";
import { Tenant } from "@/modules/tenants/tenant.model";
import { ConflictError, NotFoundError } from "@/shared/errors/app-error";

export class TenantService {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async createTenant(dto: CreateTenantDto, userId?: string): Promise<Tenant> {
    const existing = await this.tenantRepository.findBySlug(dto.slug);
    if (existing) throw new ConflictError("Tenant with this slug already exists");
    return this.tenantRepository.create(dto, userId);
  }

  async getTenantById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) throw new NotFoundError("Tenant not found");
    return tenant;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    return this.tenantRepository.findBySlug(slug);
  }

  async getTenants(): Promise<Tenant[]> {
    return this.tenantRepository.findAll();
  }

  async updateTenant(id: string, dto: UpdateTenantDto, userId?: string): Promise<Tenant> {
    if (dto.slug) {
      const existing = await this.tenantRepository.findBySlug(dto.slug);
      if (existing && existing.id !== id) {
        throw new ConflictError("Tenant with this slug already exists");
      }
    }
    return this.tenantRepository.update(id, dto, userId);
  }

  async deleteTenant(id: string, userId?: string): Promise<void> {
    await this.getTenantById(id);
    return this.tenantRepository.softDelete(id, userId);
  }
}

export default TenantService;
