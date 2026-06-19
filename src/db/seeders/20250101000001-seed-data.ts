import { QueryInterface } from "sequelize";
import { v4 as uuidv4 } from "uuid";

export default {
  async up(queryInterface: QueryInterface) {
    const companyId = uuidv4();
    const adminId = uuidv4();
    const userId = uuidv4();
    const now = new Date();

    // Seed a company
    await queryInterface.bulkInsert("companies", [
      {
        id: companyId,
        name: "Acme Corporation",
        slug: "acme",
        settings: JSON.stringify({}),
        created_at: now,
        updated_at: now,
        created_by: null,
        updated_by: null,
      },
    ]);

    // Seed a platform admin
    await queryInterface.bulkInsert("admins", [
      {
        id: adminId,
        email: "admin@acme.com",
        password_hash: "", // placeholder — set via auth flow
        first_name: "Platform",
        last_name: "Admin",
        is_active: true,
        last_login_at: null,
        created_at: now,
        updated_at: now,
      },
    ]);

    // Seed a company user
    await queryInterface.bulkInsert("users", [
      {
        id: userId,
        company_id: companyId,
        email: "john@acme.com",
        password_hash: "", // placeholder
        first_name: "John",
        last_name: "Doe",
        role: "company_admin",
        is_active: true,
        last_login_at: null,
        created_at: now,
        updated_at: now,
        created_by: null,
        updated_by: null,
      },
    ]);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete("users", { email: "john@acme.com" });
    await queryInterface.bulkDelete("admins", { email: "admin@acme.com" });
    await queryInterface.bulkDelete("companies", { slug: "acme" });
  },
};
