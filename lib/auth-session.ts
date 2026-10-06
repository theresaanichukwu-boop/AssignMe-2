import { headers } from "next/headers";
import { auth } from "./auth";
import { prisma } from "./db";

export type Role = "STUDENT" | "ADMIN" | "CONTENT_MANAGER" | "SUPPORT";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export function error(code: string, message: string, status: number, issues?: unknown) {
  return Response.json({ ok: false, error: { code, message, issues } }, { status });
}

export function success<T>(data: T, status = 200) {
  return Response.json({ ok: true, data }, { status });
}

/** Require a signed-in user; returns 401 response on failure. */
export async function requireUser() {
  const session = await getSession();
  if (!session?.user) return { response: error("UNAUTHENTICATED", "Sign in required.", 401) as Response };
  return { user: session.user as typeof session.user & { role?: string } };
}

export async function requireRole(...roles: Role[]) {
  const result = await requireUser();
  if ("response" in result) return result;
  const role = (result.user.role ?? "STUDENT") as Role;
  if (!roles.includes(role)) {
    return { response: error("FORBIDDEN", "Insufficient permissions.", 403) as Response };
  }
  return { user: result.user, role };
}

/** Load a workspace owned by the user; 404 when missing or not owned. */
export async function requireWorkspace(userId: string, id: string) {
  const workspace = await prisma.workspace.findFirst({ where: { id, userId } });
  if (!workspace) return { response: error("NOT_FOUND", "Workspace not found.", 404) as Response };
  return { workspace };
}
