import { Company } from "@/modules/companies/company.model";
import { Admin } from "@/modules/admins/admin.model";
import { User } from "@/modules/users/user.model";

declare global {
  namespace Express {
    interface Request {
      company?: Company;
      admin?: Admin;
      user?: User;
    }
  }
}
