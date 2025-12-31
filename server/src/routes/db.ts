// Generic database query route - handles Supabase-like queries
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { optionalAuthMiddleware, authMiddleware } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { clearSettingsCache } from '../lib/settings';

const router = Router();

// Table name mapping (frontend uses different names)
const tableMapping: Record<string, string> = {
  'profiles': 'userProfile',
  'users': 'user',
  'categories': 'category',
  'products': 'product',
  'product_packages': 'productPackage',
  'product_images': 'productImage',
  'product_custom_fields': 'productCustomField',
  'orders': 'order',
  'order_items': 'orderItem',
  'payments': 'payment',
  'deposits': 'deposit',
  'vouchers': 'voucher',
  'reviews': 'review',
  'cart_items': 'cartItem',
  'wishlist_items': 'wishlistItem',
  'notifications': 'notification',
  'posts': 'post',
  'comments': 'comment',
  'post_likes': 'postLike',
  'addresses': 'address',
  'site_settings': 'siteSetting',
  'site_themes': 'siteTheme',
  'site_sections': 'siteSection',
  'email_templates': 'emailTemplate',
  'email_logs': 'emailLog',
  'audit_logs': 'auditLog',
  'admin_users': 'adminUser',
  'oauth_accounts': 'oAuthAccount',
  'refresh_tokens': 'refreshToken',
  'vip_levels': 'vipLevel',
  'login_history': 'loginHistory',
  'wallet_transactions': 'walletTransaction',
  'smm_orders': 'smmOrder',
  'seller_orders': 'sellerOrder',
  'escrow_transactions': 'escrowTransaction',
  'handover_logs': 'handoverLog',
  'auctions': 'auction',
  'auction_bids': 'auctionBid',
  'daily_checkins': 'dailyCheckin',
  'points_rewards': 'pointsReward',
  'points_redemptions': 'pointsRedemption',
  'affiliate_codes': 'affiliateCode',
  'affiliate_clicks': 'affiliateClick',
  'design_orders': 'designOrder',
  'user_email_preferences': 'userEmailPreferences',
};

// Parse filter operators from query params
const parseFilters = (query: Record<string, any>, tableName?: string) => {
  const where: Record<string, any> = {};

  // Field name mapping (frontend field -> Prisma field)
  // Note: 'style' maps to 'productStyle' for Product table
  const fieldMapping: Record<string, string> = {
    'is_active': 'isActive',
    'is_featured': 'isFeatured',
    'sort_order': 'sortOrder',
    'category_id': 'categoryId',
    'product_id': 'productId',
    'user_id': 'userId',
    'order_id': 'orderId',
  };

  // Table-specific field mappings
  if (tableName === 'product') {
    fieldMapping['style'] = 'productStyle';
  }

  // Helper to convert string values to proper types
  const convertValue = (value: any) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (!isNaN(Number(value)) && value !== '') return Number(value);
    return value;
  };

  // Helper to map field name
  const mapField = (field: string) => fieldMapping[field] || field;
  
  for (const [key, value] of Object.entries(query)) {
    // Skip non-filter params
    if (['select', 'order', 'limit', 'offset', 'or'].includes(key)) continue;
    
    // Parse column.operator format
    const match = key.match(/^(.+)\.(eq|neq|gt|gte|lt|lte|like|ilike|in|is)$/);
    if (match) {
      const [, column, operator] = match;
      const mappedColumn = mapField(column);
      const convertedValue = convertValue(value);
      
      switch (operator) {
        case 'eq':
          where[mappedColumn] = convertedValue;
          break;
        case 'neq':
          where[mappedColumn] = { not: convertedValue };
          break;
        case 'gt':
          where[mappedColumn] = { gt: convertedValue };
          break;
        case 'gte':
          where[mappedColumn] = { gte: convertedValue };
          break;
        case 'lt':
          where[mappedColumn] = { lt: convertedValue };
          break;
        case 'lte':
          where[mappedColumn] = { lte: convertedValue };
          break;
        case 'like':
          where[mappedColumn] = { contains: value.replace(/%/g, '') };
          break;
        case 'ilike':
          where[mappedColumn] = { contains: value.replace(/%/g, ''), mode: 'insensitive' };
          break;
        case 'in':
          where[mappedColumn] = { in: Array.isArray(value) ? value : value.split(',') };
          break;
        case 'is':
          if (value === 'null' || value === null) {
            where[mappedColumn] = null;
          } else if (value === 'true') {
            where[mappedColumn] = true;
          } else if (value === 'false') {
            where[mappedColumn] = false;
          }
          break;
      }
    } else {
      // No operator - direct key=value (convert booleans and numbers)
      const mappedKey = mapField(key);
      where[mappedKey] = convertValue(value);
    }
  }
  
  return where;
};

// Parse order from query
const parseOrder = (orderStr?: string) => {
  if (!orderStr) return undefined;
  
  // Field name mapping for orderBy
  const orderFieldMapping: Record<string, string> = {
    'order': 'sortOrder',
    'sort_order': 'sortOrder',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
  };
  
  const parts = orderStr.split('.');
  if (parts.length >= 2) {
    const column = parts.slice(0, -1).join('.');
    const mappedColumn = orderFieldMapping[column] || column;
    const direction = parts[parts.length - 1] === 'desc' ? 'desc' : 'asc';
    return { [mappedColumn]: direction };
  }
  
  return undefined;
};

// Parse select columns
const parseSelect = (selectStr?: string): { select?: Record<string, any>, include?: Record<string, any> } | undefined => {
  if (!selectStr || selectStr === '*') return undefined;
  
  const select: Record<string, any> = {};
  const include: Record<string, any> = {};
  const columns = selectStr.split(',');
  
  for (const col of columns) {
    const trimmed = col.trim();
    
    // Skip complex nested syntax - just include the relation
    const nestedMatch = trimmed.match(/^(\w+):(\w+)\((.+)\)$/);
    if (nestedMatch) {
      const [, alias] = nestedMatch;
      // For nested relations, use include instead of select
      include[alias] = true;
    } else if (trimmed.includes(':')) {
      // Handle "relation:table(...)" - just include the relation
      const colonIndex = trimmed.indexOf(':');
      const relationName = trimmed.substring(0, colonIndex);
      include[relationName] = true;
    } else if (trimmed === '*') {
      // Select all - return undefined to get all fields
      return undefined;
    } else {
      select[trimmed] = true;
    }
  }
  
  // If we have includes, return include; otherwise return select
  if (Object.keys(include).length > 0) {
    return { include };
  }
  if (Object.keys(select).length > 0) {
    return { select };
  }
  return undefined;
};

// Generic SELECT handler
router.get('/:table', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const tableName = tableMapping[req.params.table] || req.params.table;
  const model = (prisma as any)[tableName];
  
  if (!model) {
    // Return empty array for missing tables instead of error
    // This handles cases where frontend expects tables that don't exist yet
    console.warn(`Table ${req.params.table} not found, returning empty array`);
    return res.json([]);
  }
  
  const where = parseFilters(req.query as Record<string, any>, tableName);
  const orderBy = parseOrder(req.query.order as string);
  const selectResult = parseSelect(req.query.select as string);
  const take = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  const skip = req.query.offset ? parseInt(req.query.offset as string) : undefined;
  
  // Apply user filter for user-specific tables
  const userTables = ['cartItem', 'wishlistItem', 'notification', 'address', 'order'];
  if (userTables.includes(tableName) && req.user) {
    where.userId = req.user.id;
  }
  
  try {
    const data = await model.findMany({
      where,
      orderBy,
      ...(selectResult || {}),
      take,
      skip,
    });
    
    res.json(data);
  } catch (error: any) {
    // If field doesn't exist, try progressively simpler queries
    if (error.message?.includes('Unknown argument')) {
      console.warn(`Query failed for ${tableName}, trying simpler query`);
      try {
        // Try without orderBy
        const data = await model.findMany({
          where,
          take,
          skip,
        });
        res.json(data);
      } catch (error2: any) {
        if (error2.message?.includes('Unknown argument')) {
          // Try without where filter (return all)
          console.warn(`Query still failing for ${tableName}, returning all records`);
          try {
            const data = await model.findMany({ take, skip });
            res.json(data);
          } catch (error3) {
            console.error(`All queries failed for ${tableName}`, error3);
            res.json([]);
          }
        } else {
          throw error2;
        }
      }
    } else {
      throw error;
    }
  }
}));

// Generic INSERT handler
router.post('/:table', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const tableName = tableMapping[req.params.table] || req.params.table;
  const model = (prisma as any)[tableName];
  
  if (!model) {
    throw new AppError(`Table ${req.params.table} not found`, 404);
  }
  
  // Auto-add userId for user-specific tables
  const userTables = ['cartItem', 'wishlistItem', 'notification', 'address', 'order', 'review'];
  let data = req.body;
  
  if (userTables.includes(tableName) && req.user) {
    if (Array.isArray(data)) {
      data = data.map(item => ({ ...item, userId: req.user!.id }));
    } else {
      data.userId = req.user.id;
    }
  }
  
  // Handle array insert
  if (Array.isArray(data)) {
    const result = await model.createMany({ data });
    // Clear settings cache if site_settings updated
    if (tableName === 'siteSetting') clearSettingsCache();
    res.status(201).json(result);
  } else {
    const result = await model.create({ data });
    // Clear settings cache if site_settings updated
    if (tableName === 'siteSetting') clearSettingsCache();
    res.status(201).json(result);
  }
}));

// Generic UPDATE handler
router.patch('/:table', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const tableName = tableMapping[req.params.table] || req.params.table;
  const model = (prisma as any)[tableName];
  
  if (!model) {
    throw new AppError(`Table ${req.params.table} not found`, 404);
  }
  
  const where = parseFilters(req.query as Record<string, any>);
  
  // Ensure user can only update their own data for user-specific tables
  const userTables = ['cartItem', 'wishlistItem', 'notification', 'address', 'userProfile'];
  if (userTables.includes(tableName) && req.user) {
    where.userId = req.user.id;
  }
  
  const result = await model.updateMany({
    where,
    data: req.body,
  });
  
  // Clear settings cache if site_settings updated
  if (tableName === 'siteSetting') clearSettingsCache();
  
  res.json(result);
}));

// Generic DELETE handler
router.delete('/:table', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const tableName = tableMapping[req.params.table] || req.params.table;
  const model = (prisma as any)[tableName];
  
  if (!model) {
    throw new AppError(`Table ${req.params.table} not found`, 404);
  }
  
  const where = parseFilters(req.query as Record<string, any>);
  
  // Ensure user can only delete their own data for user-specific tables
  const userTables = ['cartItem', 'wishlistItem', 'notification', 'address'];
  if (userTables.includes(tableName) && req.user) {
    where.userId = req.user.id;
  }
  
  const result = await model.deleteMany({ where });
  
  res.json(result);
}));

export default router;
