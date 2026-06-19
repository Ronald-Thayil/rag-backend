import { Company } from "@/modules/companies/company.model";
import { CreateCompanyDto } from "@/modules/companies/dto/create-company.dto";
import { UpdateCompanyDto } from "@/modules/companies/dto/update-company.dto";
import { NotFoundError } from "@/shared/errors/app-error";

export class CompanyRepository {
  async create(dto: CreateCompanyDto, adminId?: string): Promise<Company> {
    return Company.create({
      ...dto,
      created_by: adminId || null,
      updated_by: adminId || null,
    });
  }

  async findById(id: string): Promise<Company | null> {
    return Company.findByPk(id);
  }

  async findBySlug(slug: string): Promise<Company | null> {
    return Company.findOne({ where: { slug } });
  }

  async findAll(): Promise<Company[]> {
    return Company.findAll();
  }

  async update(id: string, dto: UpdateCompanyDto, adminId?: string): Promise<Company> {
    const company = await Company.findByPk(id);
    if (!company) throw new NotFoundError("Company not found");
    await company.update({ ...dto, updated_by: adminId || null });
    return company.reload();
  }

  async delete(id: string): Promise<void> {
    const company = await Company.findByPk(id);
    if (!company) throw new NotFoundError("Company not found");
    await company.destroy();
  }
}

export default CompanyRepository;
