import { Response } from "express";
import { IApiResponse } from "@/shared/interfaces";

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
