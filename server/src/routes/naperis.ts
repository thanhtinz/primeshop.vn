import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

const NAPERIS_BASE_URL = 'https://api.clone.erisvn.net';

// Helper function to make Naperis API requests
async function naperisRequest(
  endpoint: string,
  method: string,
  body: any,
  apiKey: string
): Promise<any> {
  const url = `${NAPERIS_BASE_URL}${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  console.log(`Naperis request: ${method} ${url}`, body);

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Naperis API error: ${response.status}`);
  }

  return data;
}

// Get Naperis balance
router.get('/balance', asyncHandler(async (req: Request, res: Response) => {
  const apiKey = process.env.NAPERIS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'NAPERIS_API_KEY is not configured' });
  }

  const result = await naperisRequest('/api/v2/balance', 'GET', null, apiKey);
  res.json(result);
}));

// Get all categories
router.get('/categories', asyncHandler(async (req: Request, res: Response) => {
  const apiKey = process.env.NAPERIS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'NAPERIS_API_KEY is not configured' });
  }

  const result = await naperisRequest('/api/v2/categories', 'GET', null, apiKey);
  res.json(result);
}));

// Get category details with products
router.get('/categories/:categoryId', asyncHandler(async (req: Request, res: Response) => {
  const apiKey = process.env.NAPERIS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'NAPERIS_API_KEY is not configured' });
  }

  const { categoryId } = req.params;
  const result = await naperisRequest(`/api/v2/categories/${categoryId}`, 'GET', null, apiKey);
  res.json(result);
}));

// Create order (topup)
router.post('/topup', asyncHandler(async (req: Request, res: Response) => {
  const apiKey = process.env.NAPERIS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'NAPERIS_API_KEY is not configured' });
  }

  const { categoryId, productId, data } = req.body;

  if (!categoryId || !productId) {
    return res.status(400).json({ error: 'categoryId and productId are required' });
  }

  const purchaseBody: any = {
    categoryId,
    productId,
  };

  if (data && Object.keys(data).length > 0) {
    purchaseBody.data = data;
  }

  const result = await naperisRequest('/api/v2/purchase', 'POST', purchaseBody, apiKey);
  res.json(result);
}));

// Get order status
router.get('/orders/:orderId', asyncHandler(async (req: Request, res: Response) => {
  const apiKey = process.env.NAPERIS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'NAPERIS_API_KEY is not configured' });
  }

  const { orderId } = req.params;
  const result = await naperisRequest(`/api/v2/orders/${orderId}`, 'GET', null, apiKey);
  res.json(result);
}));

// Sync prices from Naperis to local packages
// This endpoint updates package prices based on Naperis source prices and markup_percent
router.post('/sync-prices', asyncHandler(async (req: Request, res: Response) => {
  const apiKey = process.env.NAPERIS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'NAPERIS_API_KEY is not configured' });
  }

  // Get all packages with markup_percent and external_product_id
  const packagesWithMarkup = await prisma.productPackage.findMany({
    where: {
      markupPercent: { not: null },
      externalProductId: { not: null },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          externalCategoryId: true,
        },
      },
    },
  });

  if (packagesWithMarkup.length === 0) {
    return res.json({ 
      success: true, 
      message: 'No packages with markup configured',
      updated: 0 
    });
  }

  // Group packages by external_category_id to minimize API calls
  const categoryIds = [...new Set(
    packagesWithMarkup
      .map(p => p.product?.externalCategoryId)
      .filter(Boolean)
  )] as string[];

  // Fetch all categories with products from Naperis
  const categoriesResult = await naperisRequest('/api/v2/categories', 'GET', null, apiKey);
  
  if (categoriesResult.code !== 200 || !categoriesResult.data) {
    return res.status(500).json({ error: 'Failed to fetch Naperis categories' });
  }

  // Build a map of product prices: productId -> price
  const priceMap = new Map<string, number>();
  for (const category of categoriesResult.data) {
    if (category.products) {
      for (const product of category.products) {
        priceMap.set(String(product.id), product.price);
      }
    }
  }

  // Update packages
  const results: { id: string; name: string; oldPrice: number; newPrice: number; status: string }[] = [];
  
  for (const pkg of packagesWithMarkup) {
    const externalProductId = pkg.externalProductId!;
    const sourcePrice = priceMap.get(externalProductId);
    
    if (!sourcePrice) {
      results.push({
        id: pkg.id,
        name: pkg.name,
        oldPrice: Number(pkg.price),
        newPrice: Number(pkg.price),
        status: 'skipped - product not found in source',
      });
      continue;
    }

    const markupPercent = Number(pkg.markupPercent) || 0;
    const newPrice = Math.round(sourcePrice * (1 + markupPercent / 100));
    const oldPrice = Number(pkg.price);

    if (newPrice === oldPrice) {
      results.push({
        id: pkg.id,
        name: pkg.name,
        oldPrice,
        newPrice,
        status: 'unchanged',
      });
      continue;
    }

    // Update the package price
    await prisma.productPackage.update({
      where: { id: pkg.id },
      data: { price: newPrice },
    });

    results.push({
      id: pkg.id,
      name: pkg.name,
      oldPrice,
      newPrice,
      status: 'updated',
    });
  }

  const updatedCount = results.filter(r => r.status === 'updated').length;
  
  res.json({
    success: true,
    message: `Synced ${updatedCount} package prices`,
    updated: updatedCount,
    total: packagesWithMarkup.length,
    details: results,
  });
}));

// Get sync status - show packages with markup and their current vs calculated prices
router.get('/sync-status', asyncHandler(async (req: Request, res: Response) => {
  const apiKey = process.env.NAPERIS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'NAPERIS_API_KEY is not configured' });
  }

  // Get all packages with markup
  const packagesWithMarkup = await prisma.productPackage.findMany({
    where: {
      markupPercent: { not: null },
      externalProductId: { not: null },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          externalCategoryId: true,
        },
      },
    },
  });

  // Fetch Naperis prices
  const categoriesResult = await naperisRequest('/api/v2/categories', 'GET', null, apiKey);
  
  const priceMap = new Map<string, number>();
  if (categoriesResult.code === 200 && categoriesResult.data) {
    for (const category of categoriesResult.data) {
      if (category.products) {
        for (const product of category.products) {
          priceMap.set(String(product.id), product.price);
        }
      }
    }
  }

  const status = packagesWithMarkup.map(pkg => {
    const sourcePrice = priceMap.get(pkg.externalProductId!) || null;
    const markupPercent = Number(pkg.markupPercent) || 0;
    const calculatedPrice = sourcePrice ? Math.round(sourcePrice * (1 + markupPercent / 100)) : null;
    const currentPrice = Number(pkg.price);
    
    return {
      id: pkg.id,
      name: pkg.name,
      productName: pkg.product?.name,
      externalProductId: pkg.externalProductId,
      markupPercent,
      sourcePrice,
      currentPrice,
      calculatedPrice,
      needsUpdate: calculatedPrice !== null && calculatedPrice !== currentPrice,
    };
  });

  const needsUpdate = status.filter(s => s.needsUpdate).length;

  res.json({
    total: status.length,
    needsUpdate,
    packages: status,
  });
}));

export default router;
