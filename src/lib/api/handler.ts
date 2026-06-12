import { createRequestId, handleRouteError } from "@/lib/api/http";
import { logApiRequest } from "@/lib/api/logger";

export interface ApiContext {
  /** Correlation id for this request: response body meta, x-request-id, and log. */
  requestId: string;
}

type ApiRouteHandler = (
  request: Request,
  context: ApiContext,
) => Promise<Response> | Response;

const SAFE_REQUEST_ID = /^[A-Za-z0-9_-]{1,80}$/;

/**
 * Accept an inbound x-request-id only if it is a short, safe token. This lets a
 * trusted gateway propagate a trace id without opening a log-injection or
 * unbounded-key vector from arbitrary client input.
 */
function resolveRequestId(request: Request): string {
  const inbound = request.headers.get("x-request-id");
  if (inbound && SAFE_REQUEST_ID.test(inbound)) {
    return inbound;
  }

  return createRequestId();
}

function withRequestId(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers);
  headers.set("x-request-id", requestId);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Wrap a route handler so every API route gets the same guarantees:
 *  - a correlation id (reused on the body, the x-request-id header, and the log)
 *  - a single catch that routes any throw through {@link handleRouteError}
 *    (so unexpected errors are sanitized to a generic 500, never leaked)
 *  - one structured access-log line: method, path, requestId, status, duration.
 */
export function apiHandler(handler: ApiRouteHandler) {
  return async function wrappedRoute(request: Request): Promise<Response> {
    const requestId = resolveRequestId(request);
    const startedAt = Date.now();

    let response: Response;
    try {
      response = await handler(request, { requestId });
    } catch (error) {
      response = handleRouteError(error, requestId);
    }

    let path = "unknown";
    try {
      path = new URL(request.url).pathname;
    } catch {
      // Malformed URL — keep the placeholder rather than logging raw input.
    }

    logApiRequest({
      method: request.method,
      path,
      requestId,
      status: response.status,
      durationMs: Date.now() - startedAt,
    });

    return withRequestId(response, requestId);
  };
}
