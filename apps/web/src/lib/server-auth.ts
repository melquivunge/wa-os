import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = (
  process.env.API_INTERNAL_URL
  ?? process.env.NEXT_PUBLIC_API_URL
  ?? "http://localhost:8000"
).replace(/\/$/, "");
const FRONTEND_URL = (process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "");

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  active_organization: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    role: string;
  };
};

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const requestHeaders = await headers();
  const response = await fetch(`${API_URL}/api/v1/me`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Cookie: requestHeaders.get("cookie") ?? "",
      Origin: FRONTEND_URL,
      Referer: `${FRONTEND_URL}/`,
      "X-Requested-With": "XMLHttpRequest",
    },
  }).catch(() => null);

  if (!response?.ok) {
    redirect("/login");
  }

  const body = await response.json() as { data: AuthenticatedUser };

  return body.data;
}
