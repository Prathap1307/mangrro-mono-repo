export interface AdminOrderItem {
  name: string;
  qty: number;
  price: number;
}

export type AdminOrderStatus =
  | "Pending"
  | "Accepted by Restaurant"
  | "Delivery Boy Reached"
  | "Restaurant Prepared"
  | "Delivery Boy Picked Up"
  | "On The Way"
  | "Delivered";

export interface AdminOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  restaurantName: string;
  instorePickup: boolean;
  pickupLocation: string;
  customerLocation: string;
  items: AdminOrderItem[];
  deliveryCharge: number;
  tax: number;
  surcharge: number;
  status: AdminOrderStatus;
}

export const todaysOrders: AdminOrder[] = [
  {
    id: "ORD123",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    customerPhone: "1234567",
    restaurantName: "Spice Hub",
    instorePickup: true,
    pickupLocation: "Tesco Luton",
    customerLocation: "12 King Street, Luton",
    items: [
      { name: "Biryani", qty: 2, price: 8.99 },
      { name: "Coke", qty: 1, price: 1.99 },
    ],
    deliveryCharge: 3.99,
    tax: 1.2,
    surcharge: 0.5,
    status: "Pending",
  },
  {
    id: "ORD124",
    customerName: "Priya Kumar",
    customerEmail: "priya@example.com",
    customerPhone: "9876543",
    restaurantName: "Midnight Eats",
    instorePickup: false,
    pickupLocation: "",
    customerLocation: "45 Baker Street, London",
    items: [
      { name: "Paneer Wrap", qty: 1, price: 6.5 },
      { name: "Chips", qty: 2, price: 2.25 },
    ],
    deliveryCharge: 4.99,
    tax: 1.4,
    surcharge: 0,
    status: "On The Way",
  },
];

export const allOrders: AdminOrder[] = [
  ...todaysOrders,
  {
    id: "ORD125",
    customerName: "Alex Morgan",
    customerEmail: "alex@example.com",
    customerPhone: "4455667",
    restaurantName: "Grill Street",
    instorePickup: false,
    pickupLocation: "",
    customerLocation: "88 Riverside Ave",
    items: [
      { name: "Wings", qty: 12, price: 0.99 },
      { name: "Lime", qty: 6, price: 0.35 },
    ],
    deliveryCharge: 6.5,
    tax: 2.1,
    surcharge: 2.0,
    status: "Restaurant Prepared",
  },
  {
    id: "ORD126",
    customerName: "Fatima Shaik",
    customerEmail: "fatima@example.com",
    customerPhone: "1122334",
    restaurantName: "Royal Bites",
    instorePickup: true,
    pickupLocation: "Tesco Express",
    customerLocation: "22 High Street",
    items: [
      { name: "Red Wine", qty: 2, price: 19.0 },
      { name: "Cheese Board", qty: 1, price: 9.5 },
    ],
    deliveryCharge: 5.5,
    tax: 1.7,
    surcharge: 1.0,
    status: "Delivered",
  },
];
