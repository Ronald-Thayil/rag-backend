import { Tenant } from "@/modules/tenants/tenant.model";
import { User } from "@/modules/users/user.model";

declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
      user?: User;
    }
  }
}
