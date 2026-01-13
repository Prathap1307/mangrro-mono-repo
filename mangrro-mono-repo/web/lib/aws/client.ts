import { DynamoDBClient, type DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION;

function buildAwsConfig<T extends DynamoDBClientConfig | S3ClientConfig>(): T {
  const config: T = { region } as T;

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  return config;
}

export const dynamoClient = new DynamoDBClient(buildAwsConfig());

export const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const s3Client = new S3Client(buildAwsConfig());

export const tables = {
  orders: process.env.AWS_DYNAMODB_TABLE_ORDERS || "",
  items: process.env.AWS_DYNAMODB_TABLE_ITEMS || "",
  mainCategories: process.env.AWS_DYNAMODB_TABLE_MAIN_CATEGORIES || "",
  mainCategorySchedules:
    process.env.AWS_DYNAMODB_TABLE_MAIN_CATEGORY_SCHEDULES || "",
  categories: process.env.AWS_DYNAMODB_TABLE_CATEGORIES || "",
  categorySchedules: process.env.AWS_DYNAMODB_TABLE_C_SCHEDULES || "",
  subcategories: process.env.AWS_DYNAMODB_TABLE_SUBCATEGORIES || "",
  subcategorySchedules:
    process.env.AWS_DYNAMODB_TABLE_SUBCATEGORY_SCHEDULES || "",
  itemSchedules: process.env.AWS_DYNAMODB_TABLE_I_SCHEDULES || "",
  deliveryCharges: process.env.AWS_DYNAMODB_TABLE_DELIVERY_CHARGES || "",
  radius: process.env.AWS_DYNAMODB_TABLE_RADIUS || "",
  surcharge: process.env.AWS_DYNAMODB_TABLE_SURCHARGE || "",
  customers: process.env.AWS_DYNAMODB_TABLE_CUSTOMERS || "",
  pickups: process.env.AWS_PICKUP_TABLE || "",
};
