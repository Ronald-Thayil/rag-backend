export interface IAudit {
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
}

export interface ITenantAware extends IAudit {
  tenant_id: string;
}

export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
}
