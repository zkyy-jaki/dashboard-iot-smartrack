/**
 * Inventory Controller — Query the Inventory Ledger (audit trail).
 *
 * GET /api/v1/inventory/history
 *   Query params:
 *     page       (default: 1)
 *     pageSize   (default: 20, max: 100)
 *     rackId     (filter)
 *     rowId      (filter)
 *     sku        (filter)
 *     eventType  ("Stock In" | "Stock Out")
 *     from       (ISO date string, inclusive)
 *     to         (ISO date string, inclusive)
 */
import type { Request, Response } from 'express';
import { prisma } from '../config/database';
import type { ApiSuccess, ApiError, LedgerEntryDto, PaginationMeta } from '../types';

function mapLedger(entry: {
  id: string;
  txId: string;
  createdAt: Date;
  rackId: string;
  rowId: string;
  sku: string;
  prevStock: number;
  currentStock: number;
  diff: number;
  eventType: string;
  trigger: string;
  leftDistCm: number;
  rightDistCm: number;
  rack: { rackId: string };
  row: { rowId: string };
  product: { name: string };
}): LedgerEntryDto {
  const d = entry.createdAt;
  return {
    id: entry.id,
    txId: entry.txId,
    timestamp: entry.createdAt.toISOString(),
    dateOnly: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    rackId: entry.rack.rackId,
    rowId: entry.row.rowId,
    sku: entry.sku,
    productName: entry.product.name,
    prevStock: entry.prevStock,
    currentStock: entry.currentStock,
    diff: entry.diff,
    eventType: entry.eventType as LedgerEntryDto['eventType'],
    trigger: entry.trigger,
    leftDistCm: entry.leftDistCm,
    rightDistCm: entry.rightDistCm,
  };
}

export async function getInventoryHistory(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(String(req.query['page'] ?? '1'), 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query['pageSize'] ?? '20'), 10)));
    const skip = (page - 1) * pageSize;

    // Build where clause from query filters
    const where: Record<string, unknown> = {};

    if (req.query['rackId']) {
      const rack = await prisma.rack.findUnique({ where: { rackId: String(req.query['rackId']) } });
      if (rack) where['rackId'] = rack.id;
    }

    if (req.query['rowId']) {
      const row = await prisma.rackRow.findUnique({ where: { rowId: String(req.query['rowId']) } });
      if (row) where['rowId'] = row.id;
    }

    if (req.query['sku']) {
      where['sku'] = String(req.query['sku']);
    }

    if (req.query['eventType']) {
      const et = String(req.query['eventType']);
      if (et === 'Stock In' || et === 'Stock Out') {
        where['eventType'] = et;
      }
    }

    if (req.query['from'] || req.query['to']) {
      const dateFilter: Record<string, Date> = {};
      if (req.query['from']) {
        const from = new Date(String(req.query['from']));
        if (!isNaN(from.getTime())) dateFilter['gte'] = from;
      }
      if (req.query['to']) {
        const to = new Date(String(req.query['to']));
        if (!isNaN(to.getTime())) {
          to.setHours(23, 59, 59, 999);
          dateFilter['lte'] = to;
        }
      }
      if (Object.keys(dateFilter).length > 0) {
        where['createdAt'] = dateFilter;
      }
    }

    const [total, entries] = await Promise.all([
      prisma.inventoryLedger.count({ where }),
      prisma.inventoryLedger.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          rack: { select: { rackId: true } },
          row: { select: { rowId: true } },
          product: { select: { name: true } },
        },
      }),
    ]);

    const pagination: PaginationMeta = {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };

    const body: ApiSuccess<LedgerEntryDto[]> = {
      success: true,
      data: entries.map(mapLedger),
      meta: pagination as unknown as Record<string, unknown>,
    };

    res.status(200).json(body);
  } catch (err) {
    console.error('[InventoryController] getInventoryHistory error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' } satisfies ApiError);
  }
}
