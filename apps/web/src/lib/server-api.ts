import "server-only";

import { headers } from "next/headers";

const API_URL = (
  process.env.API_INTERNAL_URL
  ?? process.env.NEXT_PUBLIC_API_URL
  ?? "http://localhost:8000"
).replace(/\/$/, "");
const FRONTEND_URL = (process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "");

export async function serverApiGet<T>(path: string): Promise<T | null> {
  const requestHeaders = await headers();
  const response = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Cookie: requestHeaders.get("cookie") ?? "",
      Origin: FRONTEND_URL,
      Referer: `${FRONTEND_URL}/`,
      "X-Requested-With": "XMLHttpRequest",
    },
  }).catch(() => null);

  if (!response?.ok) return null;

  return await response.json() as T;
}
