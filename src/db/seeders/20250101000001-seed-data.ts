import * as argon2 from "argon2";
import { QueryInterface } from "sequelize";
import { v4 as uuidv4 } from "uuid";

export default {
  async up(queryInterface: QueryInterface) {
    const companyId = uuidv4();
    const adminId = uuidv4();
    const userId = uuidv4();
    const now = new Date();

    const password_hash = await argon2.hash("admin@123", {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

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

    await queryInterface.bulkInsert("admins", [
      {
        id: adminId,
        email: "admin@acme.com",
        password_hash,
        first_name: "Platform",
        last_name: "Admin",
        is_active: true,
        last_login_at: null,
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert("users", [
      {
        id: userId,
        company_id: companyId,
        email: "john@acme.com",
        password_hash,
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
