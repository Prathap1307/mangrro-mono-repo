# Categories normalization test plan

## Manual check
1. Seed DynamoDB with a category item that includes whitespace-padded values:
   - `subcategoryName: "  Subs  "`
   - `imageUrl: "  https://example.com/image.png  "`
   - `imageKey: "  images/example.png  "`
2. Call the categories endpoint:
   - `GET /api/categories`
3. Verify the response payload trims and retains the normalized values:
   - `subcategoryName` is `"Subs"`
   - `imageUrl` is `"https://example.com/image.png"`
   - `imageKey` is `"images/example.png"`
4. Repeat with empty strings or whitespace-only values to confirm the fields become `undefined` in the response.
