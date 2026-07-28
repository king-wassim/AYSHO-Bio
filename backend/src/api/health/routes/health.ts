export default {
  routes: [
    {
      method: 'GET',
      path: '/health',
      handler: 'health.check',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/health/live',
      handler: 'health.live',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/health/ready',
      handler: 'health.ready',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
