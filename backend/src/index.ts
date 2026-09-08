import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // strapi.db.query returns untyped `any` — suppressions are intentional here
    // until Strapi provides full generic types for its DB query API.
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' },
    });

    if (publicRole) {
      const publicActions = [
        'api::category.category.find',
        'api::category.category.findOne',
        'api::product.product.find',
        'api::product.product.findOne',
      ];

      for (const action of publicActions) {
        const permission = await strapi.db
          .query('plugin::users-permissions.permission')
          .findOne({ where: { action } });

        if (!permission) {
          await strapi.db.query('plugin::users-permissions.permission').create({
            data: { action, enabled: true, role: publicRole.id },
          });
        } else if (!permission.enabled) {
          await strapi.db
            .query('plugin::users-permissions.permission')
            .update({ where: { id: permission.id }, data: { enabled: true } });
        }
      }
    }
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

    // Vérifier si des catégories existent déjà
    const categoryCount = await strapi.db.query('api::category.category').count();

    if (categoryCount === 0) {
      strapi.log.info('Seeding des données (Catégories et Produits)...');

      const categoriesData = [
        {
          name: 'Soins visage',
          slug: 'soins-visage',
          tagline: 'Une peau saine, rayonnante',
          description: 'Crèmes, sérums et nettoyants dermocosmétiques pour tous les types de peau.',
        },
        {
          name: 'Corps',
          slug: 'corps',
          tagline: 'Prenez soin de votre corps',
          description: 'Huiles, baumes et laits hydratants pour une peau douce et nourrie.',
        },
        {
          name: 'Cheveux',
          slug: 'cheveux',
          tagline: 'Des cheveux forts et brillants',
          description: 'Shampoings, soins et sérums capillaires pour chaque nature de cheveu.',
        },
        {
          name: 'Bébés & Mamans',
          slug: 'bebes-mamans',
          tagline: 'Douceur et sécurité',
          description:
            'Soins adaptés aux bébés et aux mamans, testés sous contrôle dermatologique.',
        },
        {
          name: 'Compléments alimentaires',
          slug: 'complements-alimentaires',
          tagline: "Votre bien-être de l'intérieur",
          description: 'Vitamines, minéraux et compléments pour soutenir votre vitalité.',
        },
      ];

      const createdCategories: Record<string, { documentId: string }> = {};

      for (const catData of categoriesData) {
        const cat = await strapi.documents('api::category.category').create({
          data: {
            ...catData,
            documentId: undefined,
          },
          status: 'published',
        });
        createdCategories[catData.slug] = { documentId: cat.documentId };
      }

      strapi.log.info('Catégories créées.');

      const productsData = [
        {
          name: 'Crème Hydratante visage',
          brand: 'Aqualia Thermal',
          price: 42.5,
          oldPrice: 52.0,
          shortDescription: "Hydratation intense 48h pour peaux sensibles, à l'eau thermale.",
          volume: '50 ml',
          badges: ['Promo', 'Best-seller'],
          rating: 4.8,
          reviews: 124,
          categorySlug: 'soins-visage',
        },
        {
          name: 'Lait corps nourrissant',
          brand: 'Lipikar',
          price: 38.0,
          shortDescription: 'Lait corporel pour peaux sèches à atopiques, confort immédiat.',
          volume: '400 ml',
          badges: ['Best-seller'],
          rating: 4.7,
          reviews: 156,
          categorySlug: 'corps',
        },
        {
          name: 'Shampoing doux fréquence',
          brand: 'Dercos',
          price: 26.0,
          shortDescription: 'Shampoing sans sulfates pour usage quotidien, tous types de cheveux.',
          volume: '250 ml',
          rating: 4.5,
          reviews: 134,
          categorySlug: 'cheveux',
        },
        {
          name: 'Gel lavant doux bébé',
          brand: 'Mustibé',
          price: 24.0,
          shortDescription: 'Gel lavant visage et corps, pour la toilette quotidienne du bébé.',
          volume: '500 ml',
          rating: 4.8,
          reviews: 198,
          categorySlug: 'bebes-mamans',
        },
        {
          name: 'Vitamine C 1000 mg',
          brand: 'VitalC',
          price: 35.0,
          shortDescription: 'Complément alimentaire pour soutenir le système immunitaire.',
          volume: '60 comprimés',
          badges: ['Best-seller'],
          rating: 4.6,
          reviews: 167,
          categorySlug: 'complements-alimentaires',
        },
      ];

      for (const prodData of productsData) {
        const { categorySlug, ...rest } = prodData;
        await strapi.documents('api::product.product').create({
          data: {
            ...rest,
            category: createdCategories[categorySlug].documentId,
            documentId: undefined,
          },
          status: 'published',
        });
      }

      strapi.log.info('Produits créés. Seeding terminé.');
    }

    // FIX P0 #3 — Le bloc qui effaçait toutes les relations category des produits à chaque
    // redémarrage de Strapi a été supprimé. Ce code causait la perte de toutes les associations
    // produit ↔ catégorie après chaque déploiement, restart Docker ou OOM.
  },
};
