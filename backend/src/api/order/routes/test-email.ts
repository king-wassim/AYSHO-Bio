/**
 * Route de test pour l'envoi d'email via Resend.
 * Accessible uniquement aux administrateurs authentifiÃ©s.
 *
 * POST /api/orders/test-email
 */
export default {
  routes: [
    {
      method: 'POST',
      path: '/orders/test-email',
      handler: 'order.testEmail',
      config: {
        // Requires a valid admin JWT - not accessible publicly
        auth: {
          scope: ['admin'],
        },
        policies: [],
        middlewares: [],
      },
    },
  ],
};
