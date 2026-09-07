import type { Core } from '@strapi/strapi';
import { sendOrderNotification } from '../../services/email';

interface OrderResult {
  documentId?: string;
  id?: number | string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  orderNumber?: string;
  totalPrice?: number;
  state?: string;
  items?: Array<{ name?: string; quantity?: number; price?: number }>;
}

interface AfterCreateEvent {
  result: OrderResult;
}

function buildOrderNumber(id: number | string | undefined): string | undefined {
  if (id === undefined || id === null) return undefined;
  return 'AYSHO-' + String(id).padStart(6, '0');
}

export default {
  async afterCreate(event: AfterCreateEvent, strapi: Core.Strapi) {
    const order = event?.result;
    if (!order) return;

    const orderNumber = buildOrderNumber(order.id);

    if (orderNumber && !order.orderNumber && order.documentId) {
      try {
        await strapi.documents('api::order.order').update({
          documentId: order.documentId,
          data: { orderNumber },
        });
      } catch (err) {
        strapi?.log?.error?.('[order] Échec génération orderNumber :', err);
      }
    }

    const payload = {
      documentId: order.documentId,
      id: order.id,
      orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      customerAddress: order.customerAddress,
      totalPrice: order.totalPrice,
      state: order.state,
      items: order.items,
    };

    await sendOrderNotification(payload, strapi?.log);
  },
};
