const fs = require('fs');
const path = require('path');

const models = {
  category: {
    schema: {
      kind: "collectionType",
      collectionName: "categories",
      info: { singularName: "category", pluralName: "categories", displayName: "Category" },
      options: { draftAndPublish: false },
      attributes: {
        name: { type: "string", required: true },
        slug: { type: "uid", targetField: "name", required: true },
        tagline: { type: "string" },
        description: { type: "text" },
        image: { type: "string" },
        products: { type: "relation", relation: "oneToMany", target: "api::product.product", mappedBy: "category" }
      }
    }
  },
  product: {
    schema: {
      kind: "collectionType",
      collectionName: "products",
      info: { singularName: "product", pluralName: "products", displayName: "Product" },
      options: { draftAndPublish: false },
      attributes: {
        name: { type: "string", required: true },
        brand: { type: "string" },
        price: { type: "decimal", required: true },
        oldPrice: { type: "decimal" },
        image: { type: "string" },
        shortDescription: { type: "text" },
        volume: { type: "string" },
        badges: { type: "json" },
        rating: { type: "decimal" },
        reviews: { type: "integer" },
        category: { type: "relation", relation: "manyToOne", target: "api::category.category", inversedBy: "products" }
      }
    }
  },
  order: {
    schema: {
      kind: "collectionType",
      collectionName: "orders",
      info: { singularName: "order", pluralName: "orders", displayName: "Order" },
      options: { draftAndPublish: false },
      attributes: {
        customerName: { type: "string", required: true },
        customerPhone: { type: "string", required: true },
        customerAddress: { type: "text", required: true },
        totalPrice: { type: "decimal" },
        status: { type: "enumeration", enum: ["pending", "confirmed", "delivered", "cancelled"], default: "pending" },
        items: { type: "json" }
      }
    }
  }
};

for (const [api, data] of Object.entries(models)) {
  const apiPath = path.join(__dirname, 'src', 'api', api);
  const typesPath = path.join(apiPath, 'content-types', api);
  
  // Create dirs
  fs.mkdirSync(typesPath, { recursive: true });
  fs.mkdirSync(path.join(apiPath, 'controllers'), { recursive: true });
  fs.mkdirSync(path.join(apiPath, 'routes'), { recursive: true });
  fs.mkdirSync(path.join(apiPath, 'services'), { recursive: true });
  
  // Write schema
  fs.writeFileSync(path.join(typesPath, 'schema.json'), JSON.stringify(data.schema, null, 2));
  
  // Write ts files
  const tsCode = `import { factories } from '@strapi/strapi';\nexport default factories.createCore$;('api::${api}.${api}');\n`;
  fs.writeFileSync(path.join(apiPath, 'controllers', `${api}.ts`), tsCode.replace('$;', 'Controller'));
  fs.writeFileSync(path.join(apiPath, 'routes', `${api}.ts`), tsCode.replace('$;', 'Router'));
  fs.writeFileSync(path.join(apiPath, 'services', `${api}.ts`), tsCode.replace('$;', 'Service'));
}

console.log("Strapi models created successfully!");
