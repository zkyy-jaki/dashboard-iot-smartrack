/**
 * Product Controller — CRUD for registered SKU definitions.
 *
 * GET    /api/v1/products
 * POST   /api/v1/products
 * GET    /api/v1/products/:sku
 * PUT    /api/v1/products/:sku
 * DELETE /api/v1/products/:sku
 */
import type { Request, Response } from 'express';
import { prisma } from '../config/database';
import type { ApiSuccess, ApiError, ProductDto } from '../types';

function mapProductToDto(p: {
  id: string;
  sku: string;
  name: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ProductDto {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    lengthCm: p.lengthCm,
    widthCm: p.widthCm,
    heightCm: p.heightCm,
    description: p.description,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// ─── GET /api/v1/products ────────────────────────────────────────────────────
export async function listProducts(req: Request, res: Response): Promise<void> {
  try {
    const products = await prisma.product.findMany({ orderBy: { sku: 'asc' } });
    const body: ApiSuccess<ProductDto[]> = {
      success: true,
      data: products.map(mapProductToDto),
      meta: { count: products.length },
    };
    res.status(200).json(body);
  } catch (err) {
    console.error('[ProductController] listProducts error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' } satisfies ApiError);
  }
}

// ─── POST /api/v1/products ───────────────────────────────────────────────────
export async function createProduct(req: Request, res: Response): Promise<void> {
  const { sku, name, lengthCm, widthCm, heightCm, description } = req.body as {
    sku?: string;
    name?: string;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    description?: string;
  };

  // Input validation
  if (!sku || typeof sku !== 'string' || sku.trim() === '') {
    res.status(400).json({ success: false, error: 'Field "sku" is required and must be a non-empty string.' } satisfies ApiError);
    return;
  }
  if (!name || typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ success: false, error: 'Field "name" is required.' } satisfies ApiError);
    return;
  }
  if (typeof lengthCm !== 'number' || lengthCm <= 0) {
    res.status(400).json({ success: false, error: 'Field "lengthCm" must be a positive number (axial measurement axis length).' } satisfies ApiError);
    return;
  }
  if (typeof widthCm !== 'number' || widthCm <= 0) {
    res.status(400).json({ success: false, error: 'Field "widthCm" must be a positive number.' } satisfies ApiError);
    return;
  }
  if (typeof heightCm !== 'number' || heightCm <= 0) {
    res.status(400).json({ success: false, error: 'Field "heightCm" must be a positive number.' } satisfies ApiError);
    return;
  }

  try {
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      res.status(409).json({ success: false, error: `Product with SKU "${sku}" already exists.` } satisfies ApiError);
      return;
    }

    const product = await prisma.product.create({
      data: {
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        lengthCm,
        widthCm,
        heightCm,
        description: description?.trim() ?? null,
      },
    });

    res.status(201).json({ success: true, data: mapProductToDto(product) } satisfies ApiSuccess<ProductDto>);
  } catch (err) {
    console.error('[ProductController] createProduct error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' } satisfies ApiError);
  }
}

// ─── GET /api/v1/products/:sku ───────────────────────────────────────────────
export async function getProduct(req: Request, res: Response): Promise<void> {
  const { sku } = req.params;
  try {
    const product = await prisma.product.findUnique({ where: { sku } });
    if (!product) {
      res.status(404).json({ success: false, error: `Product "${sku}" not found.` } satisfies ApiError);
      return;
    }
    res.status(200).json({ success: true, data: mapProductToDto(product) } satisfies ApiSuccess<ProductDto>);
  } catch (err) {
    console.error('[ProductController] getProduct error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' } satisfies ApiError);
  }
}

// ─── PUT /api/v1/products/:sku ───────────────────────────────────────────────
export async function updateProduct(req: Request, res: Response): Promise<void> {
  const { sku } = req.params;
  const { name, lengthCm, widthCm, heightCm, description } = req.body as {
    name?: string;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    description?: string | null;
  };

  try {
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (!existing) {
      res.status(404).json({ success: false, error: `Product "${sku}" not found.` } satisfies ApiError);
      return;
    }

    const updated = await prisma.product.update({
      where: { sku },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(lengthCm !== undefined && lengthCm > 0 && { lengthCm }),
        ...(widthCm !== undefined && widthCm > 0 && { widthCm }),
        ...(heightCm !== undefined && heightCm > 0 && { heightCm }),
        ...(description !== undefined && { description }),
      },
    });

    res.status(200).json({ success: true, data: mapProductToDto(updated) } satisfies ApiSuccess<ProductDto>);
  } catch (err) {
    console.error('[ProductController] updateProduct error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' } satisfies ApiError);
  }
}

// ─── DELETE /api/v1/products/:sku ────────────────────────────────────────────
export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const { sku } = req.params;

  try {
    // Check if any rows still reference this SKU
    const usedInRows = await prisma.rackRow.count({ where: { sku } });
    if (usedInRows > 0) {
      res.status(409).json({
        success: false,
        error: `Cannot delete SKU "${sku}" — it is currently assigned to ${usedInRows} rack row(s).`,
      } satisfies ApiError);
      return;
    }

    await prisma.product.delete({ where: { sku } });
    res.status(200).json({ success: true, data: { message: `Product "${sku}" deleted.` } } satisfies ApiSuccess<{ message: string }>);
  } catch (err) {
    console.error('[ProductController] deleteProduct error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' } satisfies ApiError);
  }
}
