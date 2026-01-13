# Why DynamoDB may look empty even when API responses are 200 OK

When the API returns success but the AWS console shows no items, it usually means the writes are going somewhere other than the expected table, or they are being filtered out. Common causes include:

1. **Incorrect environment variables**  
   A mismatched `AWS_DDB_ORDERS_TABLE` (or related table names) or `AWS_REGION` will silently point the SDK at a different table/region. Verifying the deployed runtime environment matches the console region/table is critical.

2. **Credentials targeting another account**  
   `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` might belong to a different AWS account or role than the one you are checking in the console, so writes succeed but land in that other account's table.

3. **Using a local/mock endpoint**  
   If a local DynamoDB endpoint or alternate `DYNAMODB_ENDPOINT` is configured (e.g., for tests), successful calls could be writing to the local instance instead of AWS.

4. **Stage-specific tables**  
   Writes may be going to a staging table (or a table with a prefix/suffix) while you are inspecting production. Double-check any environment-specific prefixes or Terraform/CloudFormation outputs.

5. **Condition expressions preventing writes**  
   Conditional updates can return 200 when no attributes change because the item doesn't exist or the condition fails. Confirm the payload includes a valid `orderId` partition key and that `UpdateItem` requests actually modify attributes.

6. **Eventual consistency with newly created tables**  
   Very new tables or recently restored ones can briefly delay visibility; reloading the console after a few moments can help, but persistent emptiness points back to configuration/target mismatches.

Validating region/account/table settings and checking for local endpoints usually resolves "empty table" symptoms when the application itself reports success.
