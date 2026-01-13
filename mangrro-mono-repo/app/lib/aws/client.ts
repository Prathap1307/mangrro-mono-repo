import { DynamoDBClient, type DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.EXPO_PUBLIC_AWS_REGION;

const buildConfig = (): DynamoDBClientConfig => {
  const config: DynamoDBClientConfig = { region };

  const accessKeyId = process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY;

  if (accessKeyId && secretAccessKey) {
    config.credentials = { accessKeyId, secretAccessKey };
  }

  return config;
};

export const dynamoClient = new DynamoDBClient(buildConfig());
export const docClient = DynamoDBDocumentClient.from(dynamoClient);
