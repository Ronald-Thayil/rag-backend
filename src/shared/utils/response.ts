import { Response } from "express";
import { IApiResponse, PaginatedData } from "@/shared/interfaces";
import { PAGINATION } from "@/shared/constants";

export function successResponse<T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200
): void {
  const body: IApiResponse<T> = { success: true, message, data };
  res.status(statusCode).json(body);
}

export function errorResponse(
  res: Response,
  message = "Internal Server Error",
  statusCode = 500,
  errors?: unknown
): void {
  const body: IApiResponse<null> & { errors?: unknown } = {
    success: false,
    message,
    data: null,
  };
  if (errors) body.errors = errors;
  res.status(statusCode).json(body);
}

export function getPaginationParams(query: {
  page?: string;
  limit?: string;
}): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(query.page as string, 10) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(query.limit as string, 10) || PAGINATION.DEFAULT_LIMIT)
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function paginatedResponse<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = "Success"
): void {
  const totalPages = Math.ceil(total / limit);
  const paginatedData: PaginatedData<T> = { data, total, page, limit, totalPages };
  successResponse(res, paginatedData, message);
}
