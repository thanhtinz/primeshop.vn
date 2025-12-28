-- Design system triggers

-- 1. Auto create ticket when design order is created
DROP TRIGGER IF EXISTS on_design_order_created ON design_orders;
CREATE TRIGGER on_design_order_created
  AFTER INSERT ON design_orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_design_ticket();

-- 2. Update service stats when order status changes  
DROP TRIGGER IF EXISTS on_design_order_status_change ON design_orders;
CREATE TRIGGER on_design_order_status_change
  AFTER UPDATE ON design_orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_design_service_stats();

-- 3. Set escrow release date when order is completed
DROP TRIGGER IF EXISTS on_design_order_completed ON design_orders;
CREATE TRIGGER on_design_order_completed
  BEFORE UPDATE ON design_orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_escrow_release();

-- 4. Auto-match seller when order created
DROP TRIGGER IF EXISTS on_design_order_auto_match ON design_orders;
CREATE TRIGGER on_design_order_auto_match
  BEFORE INSERT ON design_orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_match_seller();

-- 5. Sync ticket status when order status changes
DROP TRIGGER IF EXISTS on_design_order_sync_ticket ON design_orders;
CREATE TRIGGER on_design_order_sync_ticket
  AFTER UPDATE ON design_orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_ticket_status();

-- 6. Update design service stats on review
DROP TRIGGER IF EXISTS on_design_service_review ON design_service_reviews;
CREATE TRIGGER on_design_service_review
  AFTER INSERT OR UPDATE ON design_service_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_design_service_stats();

-- Seller system triggers

DROP TRIGGER IF EXISTS on_seller_order_complete ON seller_orders;
CREATE TRIGGER on_seller_order_complete
  AFTER UPDATE ON seller_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_stats_on_order();

DROP TRIGGER IF EXISTS on_seller_order_level ON seller_orders;
CREATE TRIGGER on_seller_order_level
  AFTER UPDATE ON seller_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_after_order_complete();

DROP TRIGGER IF EXISTS on_seller_review ON seller_reviews;
CREATE TRIGGER on_seller_review
  AFTER INSERT OR UPDATE OR DELETE ON seller_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_stats_on_review();

-- Social triggers

DROP TRIGGER IF EXISTS on_post_like ON post_likes;
CREATE TRIGGER on_post_like
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

DROP TRIGGER IF EXISTS on_post_comment ON post_comments;
CREATE TRIGGER on_post_comment
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

DROP TRIGGER IF EXISTS on_comment_like ON comment_likes;
CREATE TRIGGER on_comment_like
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

-- Group triggers

DROP TRIGGER IF EXISTS on_group_member ON group_members;
CREATE TRIGGER on_group_member
  AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count();

DROP TRIGGER IF EXISTS on_group_post ON group_posts;
CREATE TRIGGER on_group_post
  AFTER INSERT OR DELETE ON group_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_group_post_count();

DROP TRIGGER IF EXISTS on_wallet_transaction ON group_wallet_transactions;
CREATE TRIGGER on_wallet_transaction
  BEFORE INSERT ON group_wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_balance();

DROP TRIGGER IF EXISTS on_group_create_wallet ON groups;
CREATE TRIGGER on_group_create_wallet
  AFTER INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION create_group_wallet();

DROP TRIGGER IF EXISTS on_group_add_owner ON groups;
CREATE TRIGGER on_group_add_owner
  AFTER INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_as_member();

DROP TRIGGER IF EXISTS on_group_create_permissions ON groups;
CREATE TRIGGER on_group_create_permissions
  AFTER INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION create_default_permissions();

DROP TRIGGER IF EXISTS on_group_join_code ON groups;
CREATE TRIGGER on_group_join_code
  BEFORE INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION generate_group_join_code();

-- Order triggers

DROP TRIGGER IF EXISTS on_order_status_change ON orders;
CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();

DROP TRIGGER IF EXISTS log_order_status ON orders;
CREATE TRIGGER log_order_status
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

DROP TRIGGER IF EXISTS on_order_paid_flash_sale ON orders;
CREATE TRIGGER on_order_paid_flash_sale
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_flash_sale_quantity_on_order();

DROP TRIGGER IF EXISTS on_order_paid_event ON orders;
CREATE TRIGGER on_order_paid_event
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION add_event_points_on_order();