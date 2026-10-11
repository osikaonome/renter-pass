export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Small fetch wrapper for TanStack Query hooks: JSON in, JSON out, errors thrown. */
export async function api<T>(path: string, init?: Omit<RequestInit, "body"> & { body?: unknown }): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body !== undefined ? { "Content-Type": "application/json", ...init?.headers } : init?.headers,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    if (response.status === 401 && typeof window !== "undefined") {
      // Full navigation: the session is gone, so drop all client state.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new ApiError(response.status, data?.error ?? "Something went wrong");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
