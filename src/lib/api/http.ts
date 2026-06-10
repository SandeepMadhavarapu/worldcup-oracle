import { ZodError } from "zod";

import { createApiMeta } from "@/lib/data";
import type { ApiFailure, ApiSuccess } from "@/lib/types";

function createRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function jsonOk<T>(data: T, init?: ResponseInit): Response {
  const requestId = createRequestId();
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");

  const payload: ApiSuccess<T> = {
    ok: true,
    data,
    meta: createApiMeta(requestId),
  };

  return Response.json(payload, {
    status: init?.status ?? 200,
    headers,
  });
}

export function jsonError(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
): Response {
  const requestId = createRequestId();
  const payload: ApiFailure = {
    ok: false,
    error: {
      code,
      message,
      details,
    },
    meta: createApiMeta(requestId),
  };

  return Response.json(payload, { status });
}

export function handleRouteError(error: unknown): Response {
  if (error instanceof ZodError) {
    return jsonError(
      "VALIDATION_ERROR",
      "Check the highlighted inputs and try again.",
      422,
      error.flatten(),
    );
  }

  if (error instanceof Error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }

    return jsonError("REQUEST_ERROR", error.message, 400);
  }

  return jsonError(
    "INTERNAL_ERROR",
    "Something went wrong while processing the request.",
    500,
  );
}
