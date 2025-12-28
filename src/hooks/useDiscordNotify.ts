import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 
  | 'new_order' 
  | 'payment_success' 
  | 'payment_failed' 
  | 'new_referral_registration' 
  | 'reward_request'
  | 'order_status_change'
  | 'topup_success'
  | 'topup_failed';

export interface NotificationData {
  // Order related
  order_number?: string;
  customer_email?: string;
  customer_name?: string;
  product_name?: string;
  package_name?: string;
  total_amount?: number;
  new_status?: string;
  
  // Payment related
  amount?: number;
  payment_id?: string;
  reason?: string;
  
  // Referral related
  full_name?: string;
  email?: string;
  phone?: string;
  note?: string;
  referral_code?: string;
  
  // Topup related
  naperis_order_id?: string;
  error?: string;
}

export const sendDiscordNotification = async (
  type: NotificationType,
  data: NotificationData
): Promise<boolean> => {
  try {
    console.log('Sending Discord notification:', { type, data });
    
    const { error } = await supabase.functions.invoke('discord-notify', {
      body: { type, data }
    });

    if (error) {
      console.error('Discord notification error:', error);
      return false;
    }

    console.log('Discord notification sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send Discord notification:', error);
    return false;
  }
};
