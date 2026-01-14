const bucket = process.env.EXPO_PUBLIC_AWS_S3_BUCKET_NAME;

const isHttpUrl = (value?: string) =>
  Boolean(value && (value.startsWith("http://") || value.startsWith("https://")));

export const resolveImageUri = (imageUrl?: string | null, imageKey?: string | null) => {
  if (isHttpUrl(imageUrl)) return imageUrl as string;
  if (isHttpUrl(imageKey)) return imageKey as string;
  if (imageKey && bucket) {
    return `https://${bucket}.s3.amazonaws.com/${imageKey}`;
  }
  return imageUrl ?? imageKey ?? undefined;
};
