import { Request, Response, NextFunction } from "express";
import { UserRole } from "@/shared/enums";
import {
  getPermissionsForRole,
  hasPermission,
  Permissions,
} from "@/shared/constants/permissions";
import { roleAtLeast } from "@/shared/constants/roles";
import {
  requireRole,
  requirePermission,
  requireCompanyAccess,
  requireOwnUserAccess,
} from "@/shared/middleware/rbac.middleware";
import { PermissionService } from "@/services/permission.service";
import { ForbiddenError, UnauthorizedError } from "@/shared/errors/app-error";
import { Admin } from "@/modules/admins/admin.model";
import { User } from "@/modules/users/user.model";

// ──────────────────────────────────────────────
// Mock User instances
// ──────────────────────────────────────────────
function mockUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    company_id: "company-a",
    role: UserRole.MEMBER,
    email: "member@test.com",
    is_active: true,
    ...overrides,
  } as unknown as User;
}

function mockAdmin(overrides: Partial<Admin> = {}): Admin {
  return {
    id: "admin-1",
    email: "admin@test.com",
    is_active: true,
    ...overrides,
  } as unknown as Admin;
}

// ──────────────────────────────────────────────
// Helpers: create mock req/res/next
// ──────────────────────────────────────────────
function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    path: "/test",
    method: "GET",
    params: {},
    query: {},
    body: {},
    headers: {},
    ...overrides,
  } as Request;
}

function mockRes(): Response {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

// ──────────────────────────────────────────────
// 1. PERMISSION CONSTANTS
// ──────────────────────────────────────────────
describe("Permission Constants", () => {
  describe("getPermissionsForRole", () => {
    it("returns all permissions for ADMIN", () => {
      const perms = getPermissionsForRole(UserRole.ADMIN);
      expect(perms).toEqual(Object.values(Permissions));
    });

    it("returns company admin permissions for COMPANY_ADMIN", () => {
      const perms = getPermissionsForRole(UserRole.COMPANY_ADMIN);
      expect(perms).toContain(Permissions.USERS_READ);
      expect(perms).toContain(Permissions.USERS_CREATE);
      expect(perms).toContain(Permissions.USERS_UPDATE);
      expect(perms).toContain(Permissions.USERS_DELETE);
      expect(perms).toContain(Permissions.DOCUMENTS_QUERY);
      expect(perms).toContain(Permissions.DOCUMENTS_UPLOAD);
      expect(perms).toContain(Permissions.DOCUMENTS_DELETE);
      expect(perms).not.toContain(Permissions.COMPANIES_READ);
    });

    it("returns member permissions for MEMBER", () => {
      const perms = getPermissionsForRole(UserRole.MEMBER);
      expect(perms).toContain(Permissions.DOCUMENTS_QUERY);
      expect(perms).toContain(Permissions.USERS_READ);
      expect(perms).not.toContain(Permissions.USERS_CREATE);
      expect(perms).not.toContain(Permissions.USERS_DELETE);
    });

    it("returns empty for unknown role", () => {
      expect(getPermissionsForRole("unknown")).toEqual([]);
    });
  });

  describe("hasPermission", () => {
    it("returns true when role has the permission", () => {
      expect(hasPermission(UserRole.COMPANY_ADMIN, Permissions.USERS_CREATE)).toBe(true);
    });

    it("returns false when role lacks the permission", () => {
      expect(hasPermission(UserRole.MEMBER, Permissions.USERS_DELETE)).toBe(false);
    });

    it("returns false for unknown role", () => {
      expect(hasPermission("unknown", Permissions.USERS_READ)).toBe(false);
    });
  });
});

// ──────────────────────────────────────────────
// 2. ROLE UTILITIES
// ──────────────────────────────────────────────
describe("Role Utilities", () => {
  describe("roleAtLeast", () => {
    it("returns true for ADMIN (level 3) with minimum 3", () => {
      expect(roleAtLeast(UserRole.ADMIN, 3)).toBe(true);
    });
    it("returns true for COMPANY_ADMIN (level 2) with minimum 2", () => {
      expect(roleAtLeast(UserRole.COMPANY_ADMIN, 2)).toBe(true);
    });
    it("returns false for MEMBER (level 1) with minimum 2", () => {
      expect(roleAtLeast(UserRole.MEMBER, 2)).toBe(false);
    });
    it("returns false for unknown role", () => {
      expect(roleAtLeast("unknown", 1)).toBe(false);
    });
  });
});

// ──────────────────────────────────────────────
// 3. RBAC MIDDLEWARE
// ──────────────────────────────────────────────
describe("RBAC Middleware", () => {
  describe("requireRole", () => {
    it("allows admin to bypass role check", () => {
      const req = mockReq({ admin: mockAdmin() });
      const res = mockRes();
      const next = jest.fn();

      requireRole(UserRole.MEMBER)(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("allows user with matching role", () => {
      const req = mockReq({ user: mockUser({ role: UserRole.COMPANY_ADMIN }) });
      const res = mockRes();
      const next = jest.fn();

      requireRole(UserRole.COMPANY_ADMIN)(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("rejects user without matching role with 403", () => {
      const req = mockReq({ user: mockUser({ role: UserRole.MEMBER }) });
      const res = mockRes();
      const next = jest.fn();

      requireRole(UserRole.COMPANY_ADMIN)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("returns 401 when no user or admin is present", () => {
      const req = mockReq();
      const res = mockRes();
      const next = jest.fn();

      requireRole(UserRole.ADMIN)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("requirePermission", () => {
    it("allows admin to bypass permission check", () => {
      const req = mockReq({ admin: mockAdmin() });
      const res = mockRes();
      const next = jest.fn();

      requirePermission(Permissions.USERS_CREATE)(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("allows user with sufficient permissions", () => {
      const req = mockReq({
        user: mockUser({ role: UserRole.COMPANY_ADMIN }),
      });
      const res = mockRes();
      const next = jest.fn();

      requirePermission(Permissions.USERS_CREATE)(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("rejects user without required permission with 403", () => {
      const req = mockReq({ user: mockUser({ role: UserRole.MEMBER }) });
      const res = mockRes();
      const next = jest.fn();

      requirePermission(Permissions.USERS_DELETE)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("rejects user missing one of multiple permissions with 403", () => {
      const req = mockReq({ user: mockUser({ role: UserRole.COMPANY_ADMIN }) });
      const res = mockRes();
      const next = jest.fn();

      requirePermission(Permissions.USERS_CREATE, Permissions.COMPANIES_DELETE)(
        req,
        res,
        next
      );
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("returns 401 when no user or admin is present", () => {
      const req = mockReq();
      const res = mockRes();
      const next = jest.fn();

      requirePermission(Permissions.USERS_READ)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("requireCompanyAccess", () => {
    it("allows admin to access any company", () => {
      const req = mockReq({ admin: mockAdmin() });
      const res = mockRes();
      const next = jest.fn();

      requireCompanyAccess(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("allows company_admin to access their own company", () => {
      const req = mockReq({
        user: mockUser({
          role: UserRole.COMPANY_ADMIN,
          company_id: "company-a",
        }),
        company: { id: "company-a" } as any,
      });
      const res = mockRes();
      const next = jest.fn();

      requireCompanyAccess(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("blocks company_admin from accessing another company with 403", () => {
      const req = mockReq({
        user: mockUser({
          role: UserRole.COMPANY_ADMIN,
          company_id: "company-a",
        }),
        company: { id: "company-b" } as any,
      });
      const res = mockRes();
      const next = jest.fn();

      requireCompanyAccess(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("blocks member from accessing company endpoints with 403", () => {
      const req = mockReq({
        user: mockUser({ role: UserRole.MEMBER }),
      });
      const res = mockRes();
      const next = jest.fn();

      requireCompanyAccess(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("returns 401 when not authenticated", () => {
      const req = mockReq();
      const res = mockRes();
      const next = jest.fn();

      requireCompanyAccess(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("requireOwnUserAccess", () => {
    it("allows admin to access any user", () => {
      const req = mockReq({
        admin: mockAdmin(),
        params: { id: "some-other-user" },
      });
      const res = mockRes();
      const next = jest.fn();

      requireOwnUserAccess(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("allows member to access their own data", () => {
      const req = mockReq({
        user: mockUser({ id: "user-1", role: UserRole.MEMBER }),
        params: { id: "user-1" },
      });
      const res = mockRes();
      const next = jest.fn();

      requireOwnUserAccess(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("blocks member from accessing another user with 403", () => {
      const req = mockReq({
        user: mockUser({ id: "user-1", role: UserRole.MEMBER }),
        params: { id: "user-2" },
      });
      const res = mockRes();
      const next = jest.fn();

      requireOwnUserAccess(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("allows company_admin to access other users in their company", () => {
      const req = mockReq({
        user: mockUser({ id: "admin-1", role: UserRole.COMPANY_ADMIN }),
        params: { id: "user-2" },
      });
      const res = mockRes();
      const next = jest.fn();

      requireOwnUserAccess(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});

// ──────────────────────────────────────────────
// 4. PERMISSION SERVICE
// ──────────────────────────────────────────────
describe("PermissionService", () => {
  let service: PermissionService;

  beforeEach(() => {
    service = new PermissionService();
  });

  describe("requirePermission", () => {
    it("throws UnauthorizedError when actor is undefined", () => {
      expect(() =>
        service.requirePermission(undefined, Permissions.USERS_READ)
      ).toThrow(UnauthorizedError);
    });

    it("allows admin without throwing", () => {
      const admin = mockAdmin();
      expect(() =>
        service.requirePermission(admin, Permissions.COMPANIES_DELETE)
      ).not.toThrow();
    });

    it("throws ForbiddenError when user lacks permission", () => {
      const user = mockUser({ role: UserRole.MEMBER });
      expect(() =>
        service.requirePermission(user, Permissions.USERS_DELETE)
      ).toThrow(ForbiddenError);
    });

    it("allows user with sufficient permission", () => {
      const user = mockUser({ role: UserRole.COMPANY_ADMIN });
      expect(() =>
        service.requirePermission(user, Permissions.USERS_CREATE)
      ).not.toThrow();
    });
  });

  describe("requireCompanyAccess", () => {
    it("throws UnauthorizedError when actor is undefined", () => {
      expect(() =>
        service.requireCompanyAccess(undefined, "company-a")
      ).toThrow(UnauthorizedError);
    });

    it("allows admin to access any company", () => {
      expect(() =>
        service.requireCompanyAccess(mockAdmin(), "any-company")
      ).not.toThrow();
    });

    it("allows company_admin to access their own company", () => {
      const user = mockUser({
        role: UserRole.COMPANY_ADMIN,
        company_id: "company-a",
      });
      expect(() =>
        service.requireCompanyAccess(user, "company-a")
      ).not.toThrow();
    });

    it("blocks company_admin from accessing another company", () => {
      const user = mockUser({
        role: UserRole.COMPANY_ADMIN,
        company_id: "company-a",
      });
      expect(() =>
        service.requireCompanyAccess(user, "company-b")
      ).toThrow(ForbiddenError);
    });

    it("blocks member from accessing company resources", () => {
      const user = mockUser({ role: UserRole.MEMBER });
      expect(() =>
        service.requireCompanyAccess(user, "company-a")
      ).toThrow(ForbiddenError);
    });
  });

  describe("requireOwnUserAccess", () => {
    it("allows admin to access any user", () => {
      expect(() =>
        service.requireOwnUserAccess(mockAdmin(), "any-user")
      ).not.toThrow();
    });

    it("allows user to access themselves", () => {
      const user = mockUser({ id: "user-1" });
      expect(() =>
        service.requireOwnUserAccess(user, "user-1")
      ).not.toThrow();
    });

    it("blocks member from accessing another user", () => {
      const user = mockUser({ id: "user-1", role: UserRole.MEMBER });
      expect(() =>
        service.requireOwnUserAccess(user, "user-2")
      ).toThrow(ForbiddenError);
    });

    it("allows company_admin to access another user", () => {
      const user = mockUser({
        id: "admin-1",
        role: UserRole.COMPANY_ADMIN,
      });
      expect(() =>
        service.requireOwnUserAccess(user, "user-2")
      ).not.toThrow();
    });
  });

  describe("canManageUser", () => {
    it("returns false when actor is undefined", () => {
      expect(service.canManageUser(undefined, mockUser())).toBe(false);
    });

    it("returns true for admin", () => {
      expect(service.canManageUser(mockAdmin(), mockUser())).toBe(true);
    });

    it("returns false for member", () => {
      const member = mockUser({ role: UserRole.MEMBER });
      expect(service.canManageUser(member, mockUser())).toBe(false);
    });

    it("returns true for company_admin managing user in same company", () => {
      const ca = mockUser({ role: UserRole.COMPANY_ADMIN, company_id: "a" });
      const target = mockUser({ company_id: "a" });
      expect(service.canManageUser(ca, target)).toBe(true);
    });

    it("returns false for company_admin managing user in different company", () => {
      const ca = mockUser({ role: UserRole.COMPANY_ADMIN, company_id: "a" });
      const target = mockUser({ company_id: "b" });
      expect(service.canManageUser(ca, target)).toBe(false);
    });
  });
});
