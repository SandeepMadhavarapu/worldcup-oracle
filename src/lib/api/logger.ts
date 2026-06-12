// Structured, single-line JSON logging for API routes.
//
// SAFETY CONTRACT: only the explicitly-listed fields below are ever emitted —
// method, path (pathname only; query string is dropped so nothing sensitive in
// params is logged), requestId, status, and duration. Request/response bodies,
// headers, cookies, auth tokens, and API keys are never touched, so secrets and
// PII cannot reach the logs. Error logging records the error's own message and
// (in non-production) stack for operators; our code never embeds secrets in
// error messages.

export interface ApiRequestLog {
  method: string;
  path: string;
  requestId: string;
  status: number;
  durationMs: number;
}

function isSilenced(): boolean {
  // Keep the test runner output clean. Logging still runs in dev and prod.
  return process.env.NODE_ENV === "test";
}

export function logApiRequest(fields: ApiRequestLog): void {
  if (isSilenced()) {
    return;
  }

  console.log(
    JSON.stringify({
      level: "info",
      msg: "api_request",
      time: new Date().toISOString(),
      method: fields.method,
      path: fields.path,
      requestId: fields.requestId,
      status: fields.status,
      durationMs: fields.durationMs,
    }),
  );
}

export function logApiError(fields: { requestId?: string; error: unknown }): void {
  if (isSilenced()) {
    return;
  }

  const { requestId, error } = fields;
  const message = error instanceof Error ? error.message : "Non-error thrown";

  console.error(
    JSON.stringify({
      level: "error",
      msg: "api_error",
      time: new Date().toISOString(),
      requestId: requestId ?? "unknown",
      error: message,
    }),
  );

  // Stack traces only off-production, where they aid local debugging and never
  // reach an end user.
  if (process.env.NODE_ENV !== "production" && error instanceof Error && error.stack) {
    console.error(error.stack);
  }
}
