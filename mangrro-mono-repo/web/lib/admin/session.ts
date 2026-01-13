import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "adminSession";

export const isAdminSessionActive = (): boolean =>
  cookies().get(ADMIN_SESSION_COOKIE)?.value === "true";
