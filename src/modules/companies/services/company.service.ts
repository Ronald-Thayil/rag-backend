import { CompanyRepository } from "@/modules/companies/repositories/company.repository";
import { CreateCompanyDto } from "@/modules/companies/dto/create-company.dto";
import { UpdateCompanyDto } from "@/modules/companies/dto/update-company.dto";
import { Company } from "@/modules/companies/company.model";
import { ConflictError, NotFoundError } from "@/shared/errors/app-error";
import { PaginationOptions } from "@/shared/interfaces";

export class CompanyService {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async createCompany(dto: CreateCompanyDto, adminId?: string): Promise<Company> {
    const existing = await this.companyRepository.findBySlug(dto.slug);
    if (existing) throw new ConflictError("Company with this slug already exists");
    return this.companyRepository.create(dto, adminId);
  }

  async getCompanyById(id: string): Promise<Company> {
    const company = await this.companyRepository.findById(id);
    if (!company) throw new NotFoundError("Company not found");
    return company;
  }

  async getCompanies(options?: PaginationOptions): Promise<{ rows: Company[]; count: number }> {
    return this.companyRepository.findAll(options);
  }

  async updateCompany(id: string, dto: UpdateCompanyDto, adminId?: string): Promise<Company> {
    if (dto.slug) {
      const existing = await this.companyRepository.findBySlug(dto.slug);
      if (existing && existing.id !== id) {
        throw new ConflictError("Company with this slug already exists");
      }
    }
    return this.companyRepository.update(id, dto, adminId);
  }

  async deleteCompany(id: string): Promise<void> {
    await this.getCompanyById(id);
    return this.companyRepository.delete(id);
  }
}

export default CompanyService;
