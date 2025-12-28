import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all products
router.get('/', asyncHandler(async (req, res) => {
  const { 
    category, 
    featured, 
    search, 
    page = '1', 
    limit = '12',
    sort = 'newest' 
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = { isActive: true };
  
  if (category) {
    where.category = { slug: category };
  }
  
  if (featured === 'true') {
    where.isFeatured = true;
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search as string } },
      { description: { contains: search as string } },
    ];
  }

  let orderBy: any = { createdAt: 'desc' };
  switch (sort) {
    case 'oldest':
      orderBy = { createdAt: 'asc' };
      break;
    case 'name':
      orderBy = { name: 'asc' };
      break;
    case 'popular':
      orderBy = { soldCount: 'desc' };
      break;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        packages: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { reviews: true },
        },
      },
      orderBy,
      skip,
      take: limitNum,
    }),
    prisma.product.count({ where }),
  ]);

  // Calculate average rating for each product
  const productsWithRating = await Promise.all(
    products.map(async (product) => {
      const avgRating = await prisma.review.aggregate({
        where: { productId: product.id, isHidden: false },
        _avg: { rating: true },
      });
      return {
        ...product,
        avgRating: avgRating._avg.rating || 0,
      };
    })
  );

  res.json({
    data: productsWithRating,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}));

// Get featured products
router.get('/featured', asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      packages: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
    take: 8,
  });

  res.json(products);
}));

// Get product by slug
router.get('/:slug', optionalAuthMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { slug } = req.params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      packages: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
      customFields: {
        orderBy: { sortOrder: 'asc' },
      },
      images: {
        orderBy: { sortOrder: 'asc' },
      },
      reviews: {
        where: { isHidden: false },
        include: {
          user: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!product || !product.isActive) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Increment view count
  await prisma.product.update({
    where: { id: product.id },
    data: { viewCount: { increment: 1 } },
  });

  // Calculate average rating
  const avgRating = await prisma.review.aggregate({
    where: { productId: product.id, isHidden: false },
    _avg: { rating: true },
    _count: true,
  });

  // Check if user has wishlisted this product
  let isWishlisted = false;
  if (req.user) {
    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: req.user.userId,
          productId: product.id,
        },
      },
    });
    isWishlisted = !!wishlistItem;
  }

  res.json({
    ...product,
    avgRating: avgRating._avg.rating || 0,
    reviewCount: avgRating._count,
    isWishlisted,
  });
}));

// Get product reviews
router.get('/:slug/reviews', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { page = '1', limit = '10' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId: product.id, isHidden: false },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.review.count({
      where: { productId: product.id, isHidden: false },
    }),
  ]);

  // Get rating distribution
  const ratingDistribution = await prisma.review.groupBy({
    by: ['rating'],
    where: { productId: product.id, isHidden: false },
    _count: true,
  });

  res.json({
    data: reviews,
    ratingDistribution: ratingDistribution.reduce((acc, item) => {
      acc[item.rating] = item._count;
      return acc;
    }, {} as Record<number, number>),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}));

export default router;
