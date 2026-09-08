import { factories } from '@strapi/strapi';
import type { Context } from 'koa';
import { sendOrderNotification } from '../services/email';

interface OrderItemInput {
  productId?: string;
  quantity?: number;
  name?: string;
  price?: number;
}

interface OrderCreateBody {
  data?: {
    items?: OrderItemInput[];
    [key: string]: unknown;
  };
}

// Strapi v5 db.query results are typed loosely; we cast explicitly.
interface ProductRecord {
  documentId: string;
  name: string;
  price: number;
}

// Koa's request body is not typed in @types/koa; use this helper to access it safely.
function getBody(ctx: Context): OrderCreateBody {
  return (ctx.request as unknown as { body: OrderCreateBody }).body ?? {};
}

function setBody(ctx: Context, body: OrderCreateBody): void {
  (ctx.request as unknown as { body: OrderCreateBody }).body = body;
}

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  /**
   * Override create : validates the payload, fetches real prices from the DB,
   * recomputes the total server-side, then delegates the write to Strapi.
   *
   * FIX P1 #6 — prices and totalPrice are no longer trusted from the client.
   * They are recalculated server-side from the actual Product records.
   */
  async create(ctx: Context) {
    const body = getBody(ctx);
    const items: OrderItemInput[] = Array.isArray(body?.data?.items) ? body.data!.items! : [];

    if (items.length === 0) {
      ctx.status = 400;
      ctx.body = { error: { status: 400, message: 'La commande doit contenir au moins un article.' } };
      return;
    }

    const validatedItems: Array<{ productId: string; name: string; quantity: number; price: number }> = [];
    let serverTotal = 0;

    for (const item of items) {
      const productId = item.productId;
      const quantity = Number(item.quantity);

      if (!productId || !quantity || quantity < 1 || !Number.isInteger(quantity)) {
        ctx.status = 400;
        ctx.body = { error: { status: 400, message: 'Article invalide : productId ou quantité manquant/incorrect.' } };
        return;
      }

      let product: ProductRecord | null = null;
      try {
        const numericId = isNaN(Number(productId)) ? -1 : Number(productId);
        const rows = (await strapi.db.query('api::product.product').findMany({
          where: { $or: [{ documentId: productId }, { id: numericId }] },
          select: ['documentId', 'name', 'price'],
          limit: 1,
        })) as ProductRecord[];
        product = rows[0] ?? null;
      } catch {
        // DB error handled by null check below
      }

      if (!product || typeof product.price !== 'number') {
        ctx.status = 400;
        ctx.body = { error: { status: 400, message: `Produit introuvable : ${productId}` } };
        return;
      }

      serverTotal += product.price * quantity;
      validatedItems.push({
        productId: product.documentId,
        name: product.name,
        quantity,
        price: product.price,
      });
    }

    // Replace items and totalPrice with server-computed values
    setBody(ctx, {
      ...body,
      data: {
        ...body?.data,
        items: validatedItems,
        totalPrice: Math.round(serverTotal * 1000) / 1000, // 3-decimal DT rounding
      },
    });

    const response = await super.create(ctx);

    // Fire-and-forget email notification (never blocks the HTTP response)
    const orderData = (response as { data?: Record<string, unknown> })?.data ?? {};
    const documentId = (orderData.documentId ?? orderData.id) as string | undefined;

    sendOrderNotification({ ...orderData, documentId }, strapi.log).catch((err) => {
      strapi.log.error('[order.create] Unexpected error in email notification:', err);
    });

    return response;
  },

  /**
   * Test endpoint — sends a dummy order notification to RESEND_TO.
   * Only accessible to authenticated admins (see routes/test-email.ts).
   *
   * POST /api/orders/test-email
   */
  async testEmail(ctx: Context) {
    const testOrder = {
      orderNumber: 'TEST-001',
      customerName: 'Client Test',
      customerPhone: '+216 12 345 678',
      customerEmail: 'test@example.com',
      customerAddress: '12 Rue de la Paix, Tunis 1000',
      totalPrice: 89.5,
      state: 'pending',
      items: [
        { name: 'Crème Hydratante visage', quantity: 2, price: 42.5 },
        { name: 'Lait corps nourrissant', quantity: 1, price: 4.5 },
      ],
    };

    const resendTo = process.env.RESEND_TO;
    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey) {
      ctx.status = 400;
      ctx.body = { ok: false, error: 'RESEND_API_KEY non configuré.' };
      return;
    }
    if (!resendTo) {
      ctx.status = 400;
      ctx.body = { ok: false, error: 'RESEND_TO non configuré.' };
      return;
    }

    try {
      await sendOrderNotification(testOrder, strapi.log);
      ctx.body = {
        ok: true,
        message: `Email de test envoyé à ${resendTo}`,
        order: testOrder,
      };
    } catch (err) {
      ctx.status = 500;
      ctx.body = {
        ok: false,
        error: err instanceof Error ? err.message : 'Erreur inconnue',
      };
    }
  },
}));
