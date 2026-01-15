const bucket = process.env.EXPO_PUBLIC_AWS_S3_BUCKET_NAME;
const proxyBaseUrl =
  process.env.EXPO_PUBLIC_WEB_BASE_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL;

const isHttpUrl = (value?: string) =>
  Boolean(value && (value.startsWith("http://") || value.startsWith("https://")));

const buildProxyUrl = (imageKey: string) => {
  if (!proxyBaseUrl) return undefined;
  const base = proxyBaseUrl.replace(/\/+$/, "");
  return `${base}/api/image-proxy?key=${encodeURIComponent(imageKey)}`;
};

export const resolveImageUri = (imageUrl?: string | null, imageKey?: string | null) => {
  if (isHttpUrl(imageUrl)) return imageUrl as string;
  if (isHttpUrl(imageKey)) return imageKey as string;
  if (imageKey && bucket) {
    return `https://${bucket}.s3.amazonaws.com/${imageKey}`;
  }
  if (imageKey) {
    return buildProxyUrl(imageKey);
  }
  return imageUrl ?? undefined;
};
