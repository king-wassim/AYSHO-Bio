// factories.createCoreController returns `any` in Strapi v5's current type definitions.
// The unsafe-* rules are disabled for this file until Strapi ships proper generics.
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { factories } from '@strapi/strapi';
import type { Context } from 'koa';
import { sendOrderNotification } from '../services/email';

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  /**
   * Override create to trigger an email notification after every new order.
   * The email is fire-and-forget (never blocks the HTTP response).
   */
  async create(ctx: Context) {
    // Let Strapi handle the actual database write untouched.
    const response = await super.create(ctx);

    // Fire email notification asynchronously (non-blocking)
    const orderData =
      ((response as Record<string, unknown>)?.data as Record<string, unknown>) ?? {};
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
