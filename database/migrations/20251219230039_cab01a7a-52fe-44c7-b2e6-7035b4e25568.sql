-- Add English columns to email_templates table
ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS subject_en TEXT,
ADD COLUMN IF NOT EXISTS body_en TEXT;

-- Update existing templates with English versions
UPDATE public.email_templates SET 
  subject_en = 'Order Confirmation #{{order_number}}',
  body_en = 'Hello {{customer_name}},

Thank you for your order at {{site_name}}!

Order Number: {{order_number}}
Email: {{customer_email}}
Total: {{total_amount}}

We will process your order as soon as possible.

Best regards,
{{site_name}}'
WHERE name = 'order_confirmation';

UPDATE public.email_templates SET 
  subject_en = 'Payment Successful - Order #{{order_number}}',
  body_en = 'Hello {{customer_name}},

We have received your payment for order #{{order_number}}.

Amount: {{total_amount}}
Method: {{payment_method}}

Your order is being processed.

Best regards,
{{site_name}}'
WHERE name = 'payment_success';

UPDATE public.email_templates SET 
  subject_en = 'Payment Failed - Order #{{order_number}}',
  body_en = 'Hello {{customer_name}},

Unfortunately, the payment for order #{{order_number}} was unsuccessful.

Please try again or contact support if you need assistance.

Best regards,
{{site_name}}'
WHERE name = 'payment_failed';

UPDATE public.email_templates SET 
  subject_en = 'Order #{{order_number}} Delivered',
  body_en = 'Hello {{customer_name}},

Order #{{order_number}} has been delivered successfully!

Delivery Content:
{{delivery_content}}

Thank you for shopping at {{site_name}}!

Best regards,
{{site_name}}'
WHERE name = 'order_delivered';

UPDATE public.email_templates SET 
  subject_en = 'Order #{{order_number}} Processing',
  body_en = 'Hello {{customer_name}},

Your order #{{order_number}} is being processed.

We will notify you when the order is ready for delivery.

Best regards,
{{site_name}}'
WHERE name = 'order_processing';

UPDATE public.email_templates SET 
  subject_en = 'Order #{{order_number}} Completed',
  body_en = 'Hello {{customer_name}},

Order #{{order_number}} has been completed.

Thank you for trusting {{site_name}}. We hope to serve you again!

Best regards,
{{site_name}}'
WHERE name = 'order_completed';

UPDATE public.email_templates SET 
  subject_en = 'Order #{{order_number}} Cancelled',
  body_en = 'Hello {{customer_name}},

Order #{{order_number}} has been cancelled.

If you have any questions, please contact our support.

Best regards,
{{site_name}}'
WHERE name = 'order_cancelled';

UPDATE public.email_templates SET 
  subject_en = 'Refund for Order #{{order_number}}',
  body_en = 'Hello {{customer_name}},

Order #{{order_number}} has been refunded.

Refund Amount: {{refund_amount}}

The refund will be credited to your account within 3-5 business days.

Best regards,
{{site_name}}'
WHERE name = 'order_refunded';

UPDATE public.email_templates SET 
  subject_en = 'Affiliate Registration Received',
  body_en = 'Hello {{full_name}},

We have received your affiliate program registration.

Your application is being reviewed. We will notify you of the result as soon as possible.

Best regards,
{{site_name}}'
WHERE name = 'referral_registration_received';

UPDATE public.email_templates SET 
  subject_en = 'Congratulations! Affiliate Registration Approved',
  body_en = 'Hello {{full_name}},

Congratulations! Your affiliate application has been approved.

Your referral code: {{referral_code}}

Share this code to earn commission from every order!

Best regards,
{{site_name}}'
WHERE name = 'referral_approved';