import { docClient } from "@/lib/aws/client";

// Alias the shared AWS document client so existing database helpers can reuse
// the same configuration.
export const dynamo = docClient;
