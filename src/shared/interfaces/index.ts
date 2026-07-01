export interface IAudit {
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
}

export interface ICompanyAware extends IAudit {
  company_id: string;
}

export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}
