import { getSquareClient, getSquareEnvironment } from "./squareClient";

type SquareError = { statusCode?: number };

function isUnauthorized(error: unknown): error is SquareError {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    (error as SquareError).statusCode === 401
  );
}

let cachedLocationId: string | null = null;
let pendingLocation: Promise<string> | null = null;

async function resolveActiveLocationId(): Promise<string> {
  try {
    const client = getSquareClient();
    const response = await client.locations.list();
    const locations = response.locations ?? [];
    const activeLocation = locations.find((loc) => loc.status === "ACTIVE");

    if (!activeLocation?.id) {
      throw new Error("No active Square locations available.");
    }

    return activeLocation.id;
  } catch (error) {
    if (isUnauthorized(error)) {
      const environment = getSquareEnvironment();
      throw new Error(
        `Square ${environment} credentials were rejected. Please verify the access token matches the configured environment.`
      );
    }

    throw error;
  }
}

export async function getCachedLocationId(): Promise<string> {
  if (cachedLocationId) return cachedLocationId;
  if (pendingLocation) return pendingLocation;

  pendingLocation = (async () => {
    try {
      const id = await resolveActiveLocationId();
      cachedLocationId = id;
      return id;
    } finally {
      pendingLocation = null;
    }
  })();

  return pendingLocation;
}

export function clearCachedLocation() {
  cachedLocationId = null;
}
