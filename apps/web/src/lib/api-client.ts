const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

type ValidationErrors = Record<string, string[]>;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly errors: ValidationErrors = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function readCookie(name: string) {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

async function parseError(response: Response) {
  let body: { message?: string; errors?: ValidationErrors } = {};

  try {
    body = await response.json();
  } catch {
    // Some infrastructure errors return HTML or an empty response.
  }

  const fallback = response.status === 422
    ? "Revise os dados informados e tente novamente."
    : "Não foi possível concluir a solicitação.";

  return new ApiError(body.message ?? fallback, response.status, body.errors);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(readCookie("XSRF-TOKEN") ? { "X-XSRF-TOKEN": readCookie("XSRF-TOKEN")! } : {}),
        ...init.headers,
      },
    });

    if (!response.ok) throw await parseError(response);
    if (response.status === 204) return undefined as T;

    return await response.json() as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Não foi possível conectar ao WA OS. Confirme se a API está disponível e tente novamente.",
      null,
    );
  }
}

async function prepareCookieSession() {
  await request<void>("/sanctum/csrf-cookie", { method: "GET" });
}

export type LoginInput = {
  email: string;
  password: string;
  remember: boolean;
};

export const authApi = {
  async login(input: LoginInput) {
    await prepareCookieSession();
    return request<{ message: string }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async requestPasswordReset(email: string) {
    await prepareCookieSession();
    return request<{ message: string }>("/api/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
};
