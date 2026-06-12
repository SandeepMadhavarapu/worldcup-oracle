import { ZodError } from "zod";

import { createApiMeta } from "@/lib/data";
import { logApiError } from "@/lib/api/logger";
import type { ApiFailure, ApiSuccess } from "@/lib/types";

export function createRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

interface JsonOkOptions {
  status?: number;
  headers?: HeadersInit;
  /** Correlation id, so the body meta matches the access log and x-request-id. */
  requestId?: string;
}

export function jsonOk<T>(data: T, options?: JsonOkOptions): Response {
  const requestId = options?.requestId ?? createRequestId();
  const headers = new Headers(options?.headers);
  headers.set("Cache-Control", "no-store");

  const payload: ApiSuccess<T> = {
    ok: true,
    data,
    meta: createApiMeta(requestId),
  };

  return Response.json(payload, {
    status: options?.status ?? 200,
    headers,
  });
}

export function jsonError(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
  requestId?: string,
): Response {
  const payload: ApiFailure = {
    ok: false,
    error: {
      code,
      message,
      details,
    },
    meta: createApiMeta(requestId ?? createRequestId()),
  };

  return Response.json(payload, { status });
}

function isJsonParseError(error: Error): boolean {
  return (
    error instanceof SyntaxError ||
    error.message.includes("JSON") ||
    error.message.includes("property name")
  );
}

/**
 * Maps a thrown value to a safe, typed error envelope. The contract:
 *
 *  - Zod failures -> 422 with field-level details (messages we authored).
 *  - Malformed JSON bodies -> 400 with a generic, parser-free message.
 *  - Anything else is treated as an UNEXPECTED INTERNAL error: it is logged
 *    server-side (with the requestId) and the client receives a generic 500.
 *    The raw `error.message` is NEVER placed in the response body, so internal
 *    details (stack hints, file paths, DB strings, upstream messages) cannot
 *    leak — in any environment, production included.
 */
export function handleRouteError(error: unknown, requestId?: string): Response {
  if (error instanceof ZodError) {
    return jsonError(
      "VALIDATION_ERROR",
      "Check the highlighted inputs and try again.",
      422,
      error.flatten(),
      requestId,
    );
  }

  if (error instanceof Error && isJsonParseError(error)) {
    return jsonError(
      "INVALID_JSON",
      "Invalid JSON body. Please check the request payload.",
      400,
      undefined,
      requestId,
    );
  }

  // Unexpected/internal error. Log the detail where only operators can see it,
  // then return a sanitized 500 with no internal message.
  logApiError({ requestId, error });

  return jsonError(
    "INTERNAL_ERROR",
    "Something went wrong while processing the request.",
    500,
    undefined,
    requestId,
  );
}
