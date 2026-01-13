import { SquareClient } from "square";

const SANDBOX_BASE_URL = "https://connect.squareupsandbox.com";
const PRODUCTION_BASE_URL = "https://connect.squareup.com";

type SquareEnvironment = "production" | "sandbox";

function getSquareEnvironment(): SquareEnvironment {
  const explicit = process.env.SQUARE_ENVIRONMENT?.trim().toLowerCase();
  if (explicit === "production" || explicit === "sandbox") {
    return explicit;
  }

  const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID?.trim();
  if (appId?.startsWith("sandbox-")) return "sandbox";
  if (appId) return "production";

  return process.env.NODE_ENV === "production" ? "production" : "sandbox";
}

function getAccessToken(): string {
  const token = process.env.SQUARE_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error("Square access token is not configured.");
  }
  return token;
}

function getBaseUrl(): string {
  const environment = getSquareEnvironment();
  return environment === "production" ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL;
}

let squareClient: SquareClient | null = null;

export function getSquareClient(): SquareClient {
  if (!squareClient) {
    squareClient = new SquareClient({
      baseUrl: getBaseUrl(),
      token: getAccessToken(),
    });
  }

  return squareClient;
}

export function clearSquareClientCache() {
  squareClient = null;
}

export { getSquareEnvironment };
