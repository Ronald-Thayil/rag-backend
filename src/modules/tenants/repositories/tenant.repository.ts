import { Tenant } from "@/modules/tenants/tenant.model";
import { CreateTenantDto } from "@/modules/tenants/dto/create-tenant.dto";
import { UpdateTenantDto } from "@/modules/tenants/dto/update-tenant.dto";
import { NotFoundError } from "@/shared/errors/app-error";

export class TenantRepository {
  async create(dto: CreateTenantDto, userId?: string): Promise<Tenant> {
    return Tenant.create({
      ...dto,
      created_by: userId || null,
      updated_by: userId || null,
    });
  }

  async findById(id: string): Promise<Tenant | null> {
    return Tenant.findByPk(id, { paranoid: false });
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return Tenant.findOne({ where: { slug }, paranoid: false });
  }

  async findAll(): Promise<Tenant[]> {
    return Tenant.findAll({ paranoid: false });
  }

  async update(id: string, dto: UpdateTenantDto, userId?: string): Promise<Tenant> {
    const tenant = await Tenant.findByPk(id);
    if (!tenant) throw new NotFoundError("Tenant not found");
    await tenant.update({ ...dto, updated_by: userId || null });
    return tenant.reload();
  }

  async softDelete(id: string, userId?: string): Promise<void> {
    const tenant = await Tenant.findByPk(id);
    if (!tenant) throw new NotFoundError("Tenant not found");
    await tenant.destroy();
    await tenant.update({ deleted_by: userId || null });
  }
}

export default TenantRepository;
