# Discord Notification Templates

This document describes all available Discord notification templates and how to use them.

## Available Templates

### 📦 Order Notifications

#### ORDER_PLACED
Sent when a new order is placed.

**Data:**
- `orderNumber`: string - Order number (e.g., "ORD-12345")
- `total`: string - Total amount with currency (e.g., "99,000 VND")
- `items`: number - Number of items in order

**Usage:**
```typescript
await discordService.sendTemplateNotification(
  userId,
  'ORDER_PLACED',
  {
    orderNumber: 'ORD-12345',
    total: '99,000 VND',
    items: 3
  },
  'order',
  'https://primeshop.vn/orders/12345'
);
```

#### ORDER_CONFIRMED
Sent when order is confirmed by admin/seller.

**Data:**
- `orderNumber`: string
- `total`: string

#### ORDER_DELIVERED
Sent when order is successfully delivered.

**Data:**
- `orderNumber`: string
- `total`: string
- `items`: number

#### ORDER_CANCELLED
Sent when order is cancelled.

**Data:**
- `orderNumber`: string
- `reason`: string (optional) - Cancellation reason

#### ORDER_REFUNDED
Sent when order is refunded.

**Data:**
- `orderNumber`: string
- `amount`: string - Refund amount

---

### 💰 Payment Notifications

#### PAYMENT_SUCCESS
Sent when payment is successful.

**Data:**
- `amount`: string
- `method`: string - Payment method (PayOS, PayPal, etc.)
- `transactionId`: string

#### PAYMENT_FAILED
Sent when payment fails.

**Data:**
- `amount`: string
- `reason`: string - Failure reason

#### DEPOSIT_SUCCESS
Sent when deposit is completed.

**Data:**
- `amount`: string - Deposit amount
- `balance`: string - New wallet balance

#### WITHDRAWAL_REQUEST
Sent when withdrawal is requested.

**Data:**
- `amount`: string
- `bankName`: string

#### WITHDRAWAL_COMPLETED
Sent when withdrawal is completed.

**Data:**
- `amount`: string
- `bankName`: string

---

### 👤 Account Notifications

#### WELCOME
Sent when Discord is first linked.

**Data:**
- `username`: string

#### PROFILE_UPDATED
Sent when profile is updated.

**Data:**
- `changes`: string[] - Array of changes (e.g., ["Email updated", "Avatar changed"])

#### VIP_UPGRADE
Sent when user upgrades VIP tier.

**Data:**
- `tier`: string - New tier name (e.g., "Gold", "Platinum")
- `benefits`: string[] - Array of new benefits

#### ACHIEVEMENT_UNLOCKED
Sent when achievement is unlocked.

**Data:**
- `name`: string - Achievement name
- `description`: string
- `reward`: string (optional) - Reward description

---

### 🔒 Security Notifications

#### LOGIN_ALERT
Sent on new login from different device/location.

**Data:**
- `ip`: string
- `location`: string
- `device`: string
- `time`: string

#### PASSWORD_CHANGED
Sent when password is changed.

**Data:**
- `time`: string
- `ip`: string

#### SUSPICIOUS_ACTIVITY
Sent when suspicious activity detected.

**Data:**
- `activity`: string - Description of activity
- `time`: string

#### TWO_FACTOR_ENABLED
Sent when 2FA is enabled.

**No data required**

---

### 💬 Social Notifications

#### NEW_FOLLOWER
Sent when someone follows you.

**Data:**
- `username`: string
- `profileUrl`: string

#### POST_LIKED
Sent when someone likes your post.

**Data:**
- `username`: string
- `postTitle`: string

#### NEW_COMMENT
Sent when someone comments on your post.

**Data:**
- `username`: string
- `postTitle`: string
- `comment`: string

#### FRIEND_REQUEST
Sent when someone sends friend request.

**Data:**
- `username`: string

---

### 🏪 Marketplace Notifications

#### SHOP_APPROVED
Sent when shop is approved.

**Data:**
- `shopName`: string

#### NEW_SALE
Sent when product is sold.

**Data:**
- `productName`: string
- `amount`: string
- `buyer`: string - Buyer username

#### PRODUCT_REVIEW
Sent when product receives review.

**Data:**
- `productName`: string
- `rating`: number (1-5)
- `reviewer`: string

#### LOW_STOCK_ALERT
Sent when product stock is low.

**Data:**
- `productName`: string
- `remaining`: number

#### SELLER_PAYOUT
Sent when seller payout is processed.

**Data:**
- `amount`: string
- `period`: string (e.g., "December 2025")

---

### 🔔 System Notifications

#### MAINTENANCE_SCHEDULED
Sent when maintenance is scheduled.

**Data:**
- `startTime`: string
- `duration`: string

#### NEW_FEATURE
Sent when new feature is released.

**Data:**
- `featureName`: string
- `description`: string

#### ANNOUNCEMENT
Generic announcement template.

**Data:**
- `title`: string
- `message`: string

#### VOUCHER_AVAILABLE
Sent when new voucher is available.

**Data:**
- `code`: string - Voucher code
- `discount`: string - Discount amount/percentage
- `expiresAt`: string

#### FLASH_SALE_ALERT
Sent when flash sale starts.

**Data:**
- `productName`: string
- `discount`: string
- `endsAt`: string

---

### 🎫 Support Notifications

#### TICKET_CREATED
Sent when support ticket is created.

**Data:**
- `ticketId`: string
- `subject`: string

#### TICKET_REPLIED
Sent when support team replies.

**Data:**
- `ticketId`: string
- `responder`: string

#### TICKET_RESOLVED
Sent when ticket is resolved.

**Data:**
- `ticketId`: string

---

## Usage Examples

### Basic Usage

```typescript
import { discordService } from './services/discordService';

// Send order delivered notification
await discordService.sendTemplateNotification(
  userId,
  'ORDER_DELIVERED',
  {
    orderNumber: 'ORD-12345',
    total: '99,000 VND',
    items: 3
  },
  'order',
  'https://primeshop.vn/orders/12345'
);
```

### Using Helper Functions

```typescript
import { sendOrderNotification } from './utils/notificationHelpers';

// Send order notification using helper
await sendOrderNotification(userId, order);
```

### Custom Notification (Without Template)

```typescript
// If you need a custom message not covered by templates
await discordService.sendNotification(userId, {
  title: '🎊 Custom Notification',
  message: 'Your custom message here',
  type: 'system',
  url: 'https://primeshop.vn/custom',
  metadata: {
    'Custom Field': 'Custom Value'
  }
});
```

## Color Codes

Each notification type has an associated color:

- **Order**: Green (#00D26A)
- **Payment**: Orange (#F59E0B)
- **Account**: Blue (#3B82F6)
- **System**: Gray (#6B7280)
- **Security**: Red (#EF4444)
- **Social**: Pink (#EC4899)
- **Marketplace**: Purple (#8B5CF6)

## Best Practices

1. **Always use templates** when available for consistency
2. **Include URLs** to relevant pages for better UX
3. **Keep metadata concise** - max 3-4 fields
4. **Format amounts** with proper currency symbols
5. **Test notifications** before deploying
6. **Respect user preferences** - check if notification type is enabled
7. **Handle errors gracefully** - Discord API can fail
8. **Use helper functions** for common operations

## Adding New Templates

To add a new template, edit `server/src/templates/discordTemplates.ts`:

```typescript
export const DISCORD_TEMPLATES = {
  // ... existing templates
  
  YOUR_NEW_TEMPLATE: (data: { field1: string; field2: number }) => ({
    title: '🎯 Your Title',
    message: `Your message with ${data.field1}`,
    color: 0x3B82F6,
    metadata: {
      'Field 1': data.field1,
      'Field 2': data.field2.toString(),
    },
  }),
};
```

Then create a helper function in `server/src/utils/notificationHelpers.ts`:

```typescript
export async function sendYourNotification(userId: string, data: any) {
  await discordService.sendTemplateNotification(
    userId,
    'YOUR_NEW_TEMPLATE',
    {
      field1: data.field1,
      field2: data.field2,
    },
    'system', // or appropriate type
    data.url
  );
}
```
