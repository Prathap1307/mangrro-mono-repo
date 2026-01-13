export interface CustomerAddress {
  id: string;
  primary: boolean;
  line1: string;
  line2?: string;
  town: string;
  postcode: string;
  latitude?: number;
  longitude?: number;
}

export interface Customer {
  id: string;      // same as clerkId
  name: string;
  email: string;
  phone: string;
  addresses: CustomerAddress[];
  orderHistory: string[];
  premium: boolean;
  createdAt: string;
  updatedAt: string;
}
