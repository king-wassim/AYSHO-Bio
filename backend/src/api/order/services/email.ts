import { Resend } from 'resend';

interface OrderItem {
  name?: string;
  quantity?: number;
  price?: number;
}

interface OrderData {
  documentId?: string;
  id?: number | string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  totalPrice?: number;
  state?: string;
  items?: OrderItem[];
}

interface EmailConfig {
  apiKey?: string;
  from: string;
  to?: string;
}

function readConfig(): EmailConfig {
  return {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM || 'on@resend.dev',
    to: process.env.RESEND_TO,
  };
}

function formatPrice(value: number | undefined): string {
  const n = Number(value);
  if (Number.isNaN(n)) return '0';
  return new Intl.NumberFormat('fr-TN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(n);
}

function buildOrderList(items: OrderItem[] | undefined): string {
  if (!Array.isArray(items) || items.length === 0) {
    return '<p>Aucun article</p>';
  }

  const rows = items
    .map((item) => {
      const name = escapeHtml(item?.name || 'Article');
      const qty = Number(item?.quantity) || 1;
      const price = Number(item?.price) || 0;
      const total = qty * price;
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#1f2937;">${name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#1f2937;text-align:center;">${qty}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#1f2937;text-align:right;">${formatPrice(
            price
          )} DT</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#1f2937;text-align:right;">${formatPrice(
            total
          )} DT</td>
        </tr>`;
    })
    .join('');

  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#f3f4f6;color:#374151;">
          <th style="padding:8px 12px;text-align:left;">Article</th>
          <th style="padding:8px 12px;text-align:center;">Qté</th>
          <th style="padding:8px 12px;text-align:right;">Prix unit.</th>
          <th style="padding:8px 12px;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getReference(order: OrderData): string {
  if (order.orderNumber) return order.orderNumber;
  const orderRef = order.documentId || String(order.id || order.customerName || '');
  return (orderRef || '').slice(-6).toUpperCase();
}

function buildHtml(order: OrderData): string {
  const reference = getReference(order);

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f9fafb;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#7c3aed;padding:24px 32px;color:#ffffff;">
          <h1 style="margin:0;font-size:22px;">Nouvelle commande AYSHO</h1>
          <p style="margin:6px 0 0;font-size:14px;opacity:.9;">Référence : AYSHO-${reference}</p>
        </div>

        <div style="padding:24px 32px;">
          <h3 style="margin:0 0 12px;font-size:16px;color:#111827;">Détails client</h3>
          <table style="width:100%;font-size:14px;color:#374151;">
            <tr><td style="padding:4px 0;color:#6b7280;width:130px;">Nom</td><td>${escapeHtml(
              order.customerName || ''
            )}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Téléphone</td><td>${escapeHtml(
              order.customerPhone || ''
            )}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Email</td><td>${escapeHtml(
              order.customerEmail || '—'
            )}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Adresse</td><td>${escapeHtml(
              order.customerAddress || ''
            )}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">État</td><td>${escapeHtml(
              order.state || 'pending'
            )}</td></tr>
          </table>

          <h3 style="margin:24px 0 12px;font-size:16px;color:#111827;">Articles commandés</h3>
          ${buildOrderList(order.items)}

          <div style="margin-top:16px;padding:16px;background:#f3f4f6;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:15px;font-weight:600;color:#111827;">Total commande</span>
            <span style="font-size:20px;font-weight:700;color:#7c3aed;">${formatPrice(
              order.totalPrice
            )} DT</span>
          </div>

          <p style="margin-top:24px;font-size:13px;color:#6b7280;text-align:center;">
            Paiement à la livraison (espèces) · Livraison gratuite
          </p>
        </div>
      </div>
    </div>`;
}

function buildText(order: OrderData): string {
  const reference = getReference(order);
  const items = Array.isArray(order.items) ? order.items : [];

  const lines = items.map((item) => {
    const qty = Number(item?.quantity) || 1;
    const price = Number(item?.price) || 0;
    return `- ${item?.name || 'Article'} x ${qty} = ${formatPrice(qty * price)} DT`;
  });

  return [
    'NOUVELLE COMMANDE AYSHO',
    `Référence : AYSHO-${reference}`,
    '',
    'DÉTAILS CLIENT',
    `Nom : ${order.customerName || ''}`,
    `Téléphone : ${order.customerPhone || ''}`,
    `Email : ${order.customerEmail || '—'}`,
    `Adresse : ${order.customerAddress || ''}`,
    `État : ${order.state || 'pending'}`,
    '',
    'ARTICLES',
    ...(lines.length ? lines : ['Aucun article']),
    '',
    `Total : ${formatPrice(order.totalPrice)} DT`,
    'Paiement à la livraison (espèces)',
  ].join('\n');
}

interface Logger {
  warn?: (message: string, ...args: unknown[]) => void;
  error?: (message: string, ...args: unknown[]) => void;
  info?: (message: string, ...args: unknown[]) => void;
}

/**
 * Envoie une notification de commande via Resend.
 * Ne lève jamais d'exception (fire-and-forget avec log).
 */
export async function sendOrderNotification(order: OrderData, logger?: Logger): Promise<void> {
  const { apiKey, from, to } = readConfig();
  const log = logger ?? console;

  if (!apiKey) {
    log.warn?.('[email] RESEND_API_KEY non configuré, envoi ignoré.');
    return;
  }
  if (!to) {
    log.warn?.('[email] RESEND_TO non configuré, envoi ignoré.');
    return;
  }

  const reference = getReference(order);

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `Nouvelle commande AYSHO-${reference}`,
      html: buildHtml(order),
      text: buildText(order),
    });

    if (error) {
      log.error?.('[email] Échec envoi Resend :', error);
    } else {
      log.info?.('[email] Notification de commande envoyée à', to);
    }
  } catch (err) {
    log.error?.('[email] Erreur envoi :', err);
  }
}
