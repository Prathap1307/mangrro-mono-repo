export function buildUpdateExpression(
  data: Record<string, unknown>
): {
  UpdateExpression: string;
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, unknown>;
} {
  const entries = Object.entries(data).filter(([, value]) => value !== undefined);

  if (!entries.length) {
    throw new Error("No fields provided for update");
  }

  const expressionParts: string[] = [];
  const ExpressionAttributeNames: Record<string, string> = {};
  const ExpressionAttributeValues: Record<string, unknown> = {};

  entries.forEach(([key, value], index) => {
    const nameKey = `#field${index}`;
    const valueKey = `:value${index}`;
    ExpressionAttributeNames[nameKey] = key;
    ExpressionAttributeValues[valueKey] = value;
    expressionParts.push(`${nameKey} = ${valueKey}`);
  });

  return {
    UpdateExpression: `SET ${expressionParts.join(", ")}`,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
  };
}
