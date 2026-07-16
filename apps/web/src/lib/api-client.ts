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

export type CreateCampaignInput = {
  name: string;
  audience_id: string;
  message_template_id: string;
  team_name?: string;
  message_count?: number;
  spend_amount?: number;
  scheduled_at: string | null;
  status: "draft" | "scheduled";
};

export type Campaign = {
  id: string;
  audience_id: string | null;
  message_template_id: string | null;
  message_template_name: string | null;
  audience: Audience | null;
  message_template: MessageTemplate | null;
  name: string;
  audience_name: string;
  team_name: string;
  channel: string;
  status: string;
  message_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  spend_amount: number;
  progress: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  timeline: Array<{
    label: string;
    state: "done" | "current" | "pending";
    value: string | null;
  }>;
  recipients: Array<{
    id: string;
    name: string;
    phone: string;
    status: "queued" | "delivered" | "read" | "failed";
    last_event_at: string | null;
  }>;
};

export type Audience = {
  id: string;
  name: string;
  team_name: string;
  source: string;
  contact_count: number;
  estimated_spend_amount: number;
  rules: string[];
  refreshed_at: string | null;
};

export type MessageTemplate = {
  id: string;
  name: string;
  team_name: string;
  category: string;
  status: string;
  language: string;
  body: string;
  last_used_at: string | null;
};

export type OrganizationRole = "owner" | "admin" | "marketing" | "analyst";

export type OrganizationMember = {
  id: string;
  name: string;
  email: string;
  role: OrganizationRole;
};

export type ContactImport = {
  id: string;
  source_name: string;
  team_name: string;
  status: "processed" | "processed_with_errors" | string;
  total_rows: number;
  accepted_rows: number;
  failed_rows: number;
  failure_samples: Array<{ line: number; reason: string }>;
  processed_at: string | null;
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

export const campaignApi = {
  async create(input: CreateCampaignInput) {
    await prepareCookieSession();
    return request<{ data: Campaign }>("/api/v1/campaigns", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async validate(id: string) {
    await prepareCookieSession();
    return request<{ data: { ready: boolean; errors: Record<string, string[]>; warnings: string[] } }>(`/api/v1/campaigns/${id}/validate`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  async transition(id: string, action: "start" | "pause" | "resume" | "cancel") {
    await prepareCookieSession();
    return request<{ data: Campaign }>(`/api/v1/campaigns/${id}/${action}`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
};

export const audienceApi = {
  async create(input: { name: string; team_name: string; status: "all" | "active" | "inactive"; tag?: string }) {
    await prepareCookieSession();
    return request<{ data: Audience }>("/api/v1/audiences", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};

export const organizationMemberApi = {
  async create(organizationId: string, input: { name: string; email: string; role: OrganizationRole }) {
    await prepareCookieSession();
    return request<{ data: OrganizationMember }>(`/api/v1/organizations/${organizationId}/members`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateRole(organizationId: string, memberId: string, role: OrganizationRole) {
    await prepareCookieSession();
    return request<{ data: OrganizationMember }>(`/api/v1/organizations/${organizationId}/members/${memberId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },

  async remove(organizationId: string, memberId: string) {
    await prepareCookieSession();
    return request<void>(`/api/v1/organizations/${organizationId}/members/${memberId}`, {
      method: "DELETE",
    });
  },
};

export const contactImportApi = {
  async create(input: { source_name: string; team_name: string; csv_text: string }) {
    await prepareCookieSession();
    return request<{ data: ContactImport }>("/api/v1/contact-imports", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
