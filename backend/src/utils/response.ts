import type { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(
  res: Response,
  message: string,
  data: T,
  options: { status?: number; pagination?: PaginationMeta } = {},
) {
  res.status(options.status ?? 200).json({
    success: true,
    message,
    data,
    ...(options.pagination && { pagination: options.pagination }),
  });
}

export function buildPagination(page: number, limit: number, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}
