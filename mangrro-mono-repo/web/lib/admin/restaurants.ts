import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient, type DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { deleteItemImage, getItemImageUrl } from "../aws/s3";

export interface AdminRestaurant {
  id: string;
  name: string;
  keywords: string[];
  cuisine: string[];
  categories?: RestaurantCategory[];
  address: string;
  lat: string;
  lng: string;
  description: string;
  imageKey?: string;
  imageUrl?: string;
  averagePrepTime: string;
  active: boolean;
  nextActivationTime: string;
  username: string;
  password: string;
}

export interface RestaurantCategoryScheduleSlot {
  start: string;
  end: string;
}

export interface RestaurantCategoryScheduleDay {
  day: string;
  slots: RestaurantCategoryScheduleSlot[];
}

export interface RestaurantCategory {
  id: string;
  name: string;
  active: boolean;
  nextActivationTime: string;
  schedule: RestaurantCategoryScheduleDay[];
}

function getClient() {
  const config: DynamoDBClientConfig = { region: process.env.AWS_REGION };
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }
  return new DynamoDBClient(config);
}

const RESTAURANTS_TABLE = process.env.AWS_DYNAMODB_TABLE_RESTAURANTS || "";

export async function listAdminRestaurants(): Promise<AdminRestaurant[]> {
  if (!RESTAURANTS_TABLE) return [];
  const client = getClient();
  const response = await client.send(
    new ScanCommand({
      TableName: RESTAURANTS_TABLE,
    }),
  );

  const restaurants = (response.Items || []).map((item) => ({
    id: item.id as string,
    name: (item.name as string) || "",
    keywords: Array.isArray(item.keywords)
      ? (item.keywords as string[]).map((keyword) => keyword.trim()).filter(Boolean)
      : [],
    cuisine: Array.isArray(item.cuisine)
      ? (item.cuisine as string[]).map((value) => value.trim()).filter(Boolean)
      : [],
    categories: Array.isArray(item.categories)
      ? (item.categories as RestaurantCategory[])
      : [],
    address: (item.address as string) || "",
    lat: (item.lat as string) || "",
    lng: (item.lng as string) || "",
    description: (item.description as string) || "",
    imageKey: item.imageKey as string | undefined,
    averagePrepTime: (item.averagePrepTime as string) || "",
    active: Boolean(item.active),
    nextActivationTime: (item.nextActivationTime as string) || "",
    username: (item.username as string) || "",
    password: (item.password as string) || "",
  }));

  const withImages = await Promise.all(
    restaurants.map(async (restaurant) => {
      if (!restaurant.imageKey) return restaurant;
      const imageUrl = await getItemImageUrl(restaurant.imageKey);
      return { ...restaurant, imageUrl };
    }),
  );

  return withImages;
}

export async function getAdminRestaurantByName(name: string) {
  const restaurants = await listAdminRestaurants();
  return restaurants.find(
    (restaurant) => restaurant.name.toLowerCase() === name.toLowerCase(),
  );
}

export async function saveAdminRestaurantCategories(
  restaurantName: string,
  categories: RestaurantCategory[],
) {
  if (!RESTAURANTS_TABLE) return [];
  const existing = await getAdminRestaurantByName(restaurantName);
  if (!existing) return [];
  const client = getClient();
  const updated: AdminRestaurant = {
    ...existing,
    categories,
  };

  await client.send(
    new PutCommand({
      TableName: RESTAURANTS_TABLE,
      Item: {
        ...updated,
      },
    }),
  );

  return categories;
}

export async function saveAdminRestaurant(restaurant: AdminRestaurant) {
  if (!RESTAURANTS_TABLE) return restaurant;
  const client = getClient();

  if (restaurant.id) {
    const existing = await client.send(
      new GetCommand({ TableName: RESTAURANTS_TABLE, Key: { id: restaurant.id } }),
    );
    const oldKey = existing?.Item?.imageKey;
    if (oldKey && oldKey !== restaurant.imageKey) {
      await deleteItemImage(oldKey);
    }
  }

  await client.send(
    new PutCommand({
      TableName: RESTAURANTS_TABLE,
      Item: {
        ...restaurant,
      },
    }),
  );

  return restaurant;
}

export async function deleteAdminRestaurant(id: string) {
  if (!RESTAURANTS_TABLE) return;
  const client = getClient();
  await client.send(
    new DeleteCommand({
      TableName: RESTAURANTS_TABLE,
      Key: { id },
    }),
  );
}
