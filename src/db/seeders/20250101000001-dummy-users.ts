import { QueryInterface } from "sequelize";
import { v4 as uuidv4 } from "uuid";

export default {
  async up(queryInterface: QueryInterface) {
    const tenantId = uuidv4();
    const adminId = uuidv4();
    const userId = uuidv4();
    const now = new Date();

    await queryInterface.bulkInsert("tenants", [
      {
        id: tenantId,
        name: "Acme Corporation",
        slug: "acme",
        is_active: true,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        created_by: null,
        updated_by: null,
        deleted_by: null,
      },
    ]);

    await queryInterface.bulkInsert("users", [
      {
        id: adminId,
        tenant_id: tenantId,
        first_name: "System",
        last_name: "Admin",
        email: "admin@acme.com",
        phone: null,
        password_hash: null,
        role: "SUPER_ADMIN",
        is_active: true,
        last_login_at: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        created_by: null,
        updated_by: null,
        deleted_by: null,
      },
      {
        id: userId,
        tenant_id: tenantId,
        first_name: "John",
        last_name: "Doe",
        email: "john@acme.com",
        phone: null,
        password_hash: null,
        role: "USER",
        is_active: true,
        last_login_at: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        created_by: null,
        updated_by: null,
        deleted_by: null,
      },
    ]);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete("users", {
      email: ["admin@acme.com", "john@acme.com"],
    });
    await queryInterface.bulkDelete("tenants", { slug: "acme" });
  },
};
