export interface PickupImage {
  s3Key: string;
  s3Url: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
}

export interface Pickup {
  pickupId: string;
  pickupAddress: string;
  dropoffAddress: string;
  parcelSize: "Small" | "Medium" | "Large";
  pickupTime: string; // ISO string
  dropTime?: string;

  image?: PickupImage;

  status: "pending" | "assigned" | "completed" | "cancelled";
  createdAt: string;
}
