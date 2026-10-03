/**
 * Dev-only: with DB_TRACE=1, logs every Supabase request the server makes
 * ("[db] POST /rest/v1/rpc/nearby_profiles"), to count calls per screen and action.
 */
export const tracedFetch: typeof fetch | undefined =
  process.env.DB_TRACE === "1"
    ? (input, init) => {
        const url = new URL(
          input instanceof Request ? input.url : input.toString(),
        );
        const method =
          init?.method ?? (input instanceof Request ? input.method : "GET");
        console.log(`[db] ${method} ${url.pathname}`);
        return fetch(input, init);
      }
    : undefined;

/** Supabase client options that enable the tracer when it is on. */
export const traceOptions = tracedFetch
  ? { global: { fetch: tracedFetch } }
  : {};
