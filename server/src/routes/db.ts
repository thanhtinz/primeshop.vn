// Generic database query route - handles Supabase-like queries
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { optionalAuthMiddleware, authMiddleware } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';

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
  // Add more mappings as needed
};

// Parse filter operators from query params
const parseFilters = (query: Record<string, any>) => {
  const where: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(query)) {
    // Skip non-filter params
    if (['select', 'order', 'limit', 'offset', 'or'].includes(key)) continue;
    
    // Parse column.operator format
    const match = key.match(/^(.+)\.(eq|neq|gt|gte|lt|lte|like|ilike|in|is)$/);
    if (match) {
      const [, column, operator] = match;
      
      switch (operator) {
        case 'eq':
          where[column] = value;
          break;
        case 'neq':
          where[column] = { not: value };
          break;
        case 'gt':
          where[column] = { gt: value };
          break;
        case 'gte':
          where[column] = { gte: value };
          break;
        case 'lt':
          where[column] = { lt: value };
          break;
        case 'lte':
          where[column] = { lte: value };
          break;
        case 'like':
          where[column] = { contains: value.replace(/%/g, '') };
          break;
        case 'ilike':
          where[column] = { contains: value.replace(/%/g, ''), mode: 'insensitive' };
          break;
        case 'in':
          where[column] = { in: Array.isArray(value) ? value : value.split(',') };
          break;
        case 'is':
          if (value === 'null' || value === null) {
            where[column] = null;
          } else if (value === 'true') {
            where[column] = true;
          } else if (value === 'false') {
            where[column] = false;
          }
          break;
      }
    }
  }
  
  return where;
};

// Parse order from query
const parseOrder = (orderStr?: string) => {
  if (!orderStr) return undefined;
  
  const parts = orderStr.split('.');
  if (parts.length >= 2) {
    const column = parts.slice(0, -1).join('.');
    const direction = parts[parts.length - 1] === 'desc' ? 'desc' : 'asc';
    return { [column]: direction };
  }
  
  return undefined;
};

// Parse select columns
const parseSelect = (selectStr?: string) => {
  if (!selectStr || selectStr === '*') return undefined;
  
  const select: Record<string, any> = {};
  const columns = selectStr.split(',');
  
  for (const col of columns) {
    const trimmed = col.trim();
    
    // Handle nested selects like "profile:profiles(*)"
    const nestedMatch = trimmed.match(/^(\w+):(\w+)\((.+)\)$/);
    if (nestedMatch) {
      const [, alias, table, nestedSelect] = nestedMatch;
      select[alias] = {
        select: nestedSelect === '*' ? true : parseSelect(nestedSelect),
      };
    } else {
      select[trimmed] = true;
    }
  }
  
  return select;
};

// Generic SELECT handler
router.get('/:table', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const tableName = tableMapping[req.params.table] || req.params.table;
  const model = (prisma as any)[tableName];
  
  if (!model) {
    throw new AppError(`Table ${req.params.table} not found`, 404);
  }
  
  const where = parseFilters(req.query as Record<string, any>);
  const orderBy = parseOrder(req.query.order as string);
  const select = parseSelect(req.query.select as string);
  const take = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  const skip = req.query.offset ? parseInt(req.query.offset as string) : undefined;
  
  // Apply user filter for user-specific tables
  const userTables = ['cartItem', 'wishlistItem', 'notification', 'address', 'order'];
  if (userTables.includes(tableName) && req.user) {
    where.userId = req.user.id;
  }
  
  const data = await model.findMany({
    where,
    orderBy,
    select: select || undefined,
    take,
    skip,
  });
  
  res.json(data);
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
    res.status(201).json(result);
  } else {
    const result = await model.create({ data });
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
