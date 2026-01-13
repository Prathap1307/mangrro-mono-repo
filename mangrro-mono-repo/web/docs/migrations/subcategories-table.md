# Subcategories table migration

## DynamoDB table
- Table name: `Subcategories` (or set `AWS_DYNAMODB_TABLE_SUBCATEGORIES`)
- Partition key: `id` (string)

## Attributes (per item)
- `id` (string)
- `category_id` (string)
- `name` (string)
- `slug` (string)
- `image_url` (string)
- `is_active` (boolean)
- `sort_order` (number)
- `created_at` (string, ISO-8601)
- Optional: `image_key` (string) for S3 key tracking

## AWS CLI example
```bash
aws dynamodb create-table \
  --table-name Subcategories \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

## Environment
Add to your runtime env:
```
AWS_DYNAMODB_TABLE_SUBCATEGORIES=Subcategories
```

## Optional index (future)
If you need fast lookups by category, add a GSI on `category_id`.
