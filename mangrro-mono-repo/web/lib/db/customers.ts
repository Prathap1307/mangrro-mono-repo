import { PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "@/lib/db/client";
import { getTableName } from "@/lib/db/tables";
import type { Customer } from "@/types/customer";

function customersTable() {
  return getTableName("CUSTOMERS");
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const tableName = customersTable();

  const res = await dynamo.send(
    new GetCommand({
      TableName: tableName,
      Key: { id },
    })
  );
  return (res.Item as Customer) ?? null;
}
export async function createCustomer(customer: Customer) {
  const tableName = customersTable();

  await dynamo.send(
    new PutCommand({
      TableName: tableName,
      Item: customer,
    })
  );
}

export async function updateCustomer(id: string, data: Partial<Customer>) {
  const tableName = customersTable();
  const now = new Date().toISOString();

  await dynamo.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { id },
      UpdateExpression: `
        set #name = :name,
            phone = :phone,
            addresses = :addresses,
            updatedAt = :updatedAt
      `,
      ExpressionAttributeNames: {
        "#name": "name",
      },
      ExpressionAttributeValues: {
        ":name": data.name,
        ":phone": data.phone,
        ":addresses": data.addresses ?? [],   // 👍 never undefined
        ":updatedAt": now,
      },
    })
  );
}
