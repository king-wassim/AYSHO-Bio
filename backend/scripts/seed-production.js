#!/usr/bin/env node
/**
 * Production Seed Script for Neon PostgreSQL
 * Run this AFTER migration to seed initial data (admin user, settings, etc.)
 * Run with: NODE_ENV=production node scripts/seed-production.js
 */

const { createClient } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.production' });

const NEON_DATABASE_URL = process.env.DATABASE_URL;

if (!NEON_DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.production');
  process.exit(1);
}

const sql = createClient({ connectionString: NEON_DATABASE_URL });
const db = drizzle(sql);

async function seedProduction() {
  console.log('🌱 Seeding production database...\n');
  
  try {
    // 1. Create admin user if not exists
    console.log('👤 Creating admin user...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@aysho.com';
    const adminPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');
    
    // Check if admin exists
    const existingAdmin = await sql.query(
      `SELECT id FROM "admin-user" WHERE email = $1`,
      [adminEmail]
    );
    
    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await hashPassword(adminPassword);
      await sql.query(`
        INSERT INTO "admin-user" (firstname, lastname, email, password, is_active, roles, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, ['Admin', 'User', adminEmail, hashedPassword, true, JSON.stringify([{ type: 'super-admin' }])]);
      console.log(`   ✅ Admin user created: ${adminEmail}`);
      console.log(`   🔑 Password: ${adminPassword}`);
      console.log('   ⚠️  SAVE THIS PASSWORD! It will not be shown again.');
    } else {
      console.log(`   ℹ️  Admin user already exists: ${adminEmail}`);
    }
    
    // 2. Create API tokens for services
    console.log('\n🔑 Creating API tokens...');
    
    const tokens = [
      { name: 'Cloudflare Pages Preview', type: 'read-only', description: 'Preview deployments' },
      { name: 'Cloudflare Pages Production', type: 'read-only', description: 'Production deployments' },
      { name: 'Cloudinary Webhook', type: 'full-access', description: 'Cloudinary webhook handler' },
      { name: 'Sentry Monitoring', type: 'read-only', description: 'Error tracking' },
    ];
    
    for (const token of tokens) {
      const existing = await sql.query(
        `SELECT id FROM "api-token" WHERE name = $1`,
        [token.name]
      );
      
      if (existing.rows.length === 0) {
        const tokenValue = crypto.randomBytes(32).toString('hex');
        await sql.query(`
          INSERT INTO "api-token" (name, description, type, token, expires_at, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `, [token.name, token.description, token.type, tokenValue, null]);
        console.log(`   ✅ Token created: ${token.name} (${tokenValue.slice(0, 8)}...)`);
      }
    }
    
    // 3. Configure Cloudinary plugin settings
    console.log('\n☁️  Configuring Cloudinary...');
    const cloudinaryConfig = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    };
    
    if (cloudinaryConfig.cloud_name && cloudinaryConfig.api_key && cloudinaryConfig.api_secret) {
      await sql.query(`
        INSERT INTO "plugin-config" (plugin_name, config, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT (plugin_name) DO UPDATE SET config = $2, updated_at = NOW()
      `, ['upload', JSON.stringify({ provider: 'cloudinary', providerOptions: cloudinaryConfig })]);
      console.log('   ✅ Cloudinary configured');
    } else {
      console.log('   ⚠️  Cloudinary credentials not set in .env.production');
    }
    
    // 4. Configure email (if SMTP provided)
    console.log('\n📧 Configuring email...');
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      await sql.query(`
        INSERT INTO "plugin-config" (plugin_name, config, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT (plugin_name) DO UPDATE SET config = $2, updated_at = NOW()
      `, ['email', JSON.stringify({
        provider: 'nodemailer',
        providerOptions: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
        settings: {
          defaultFrom: process.env.SMTP_FROM || 'noreply@aysho.com',
          defaultReplyTo: process.env.SMTP_REPLY_TO || 'support@aysho.com',
        },
      })]);
      console.log('   ✅ Email configured');
    } else {
      console.log('   ⚠️  SMTP credentials not set in .env.production');
    }
    
    // 5. Set up default permissions for public role
    console.log('\n🔐 Configuring public permissions...');
    await setupPublicPermissions();
    
    console.log('\n✅ Production seeding completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Save the admin password shown above');
    console.log('   2. Configure DNS for your custom domain');
    console.log('   3. Set up Cloudinary webhook: https://your-domain.com/api/upload/cloudinary-webhook');
    console.log('   4. Configure Sentry DSN in .env.production');
    console.log('   5. Run smoke tests: npm run test:smoke');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

async function hashPassword(password) {
  const crypto = require('crypto');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}$${hash}`;
}

async function setupPublicPermissions() {
  // Find public role
  const publicRole = await sql.query(
    `SELECT id FROM "admin-role" WHERE code = 'public'`
  );
  
  if (publicRole.rows.length === 0) {
    console.log('   ⚠️  Public role not found, skipping permissions');
    return;
  }
  
  const publicRoleId = publicRole.rows[0].id;
  
  // Default permissions for public API access
  const permissions = [
    'api::product.product.find',
    'api::product.product.findOne',
    'api::category.category.find',
    'api::category.category.findOne',
    'api::brand.brand.find',
    'api::brand.brand.findOne',
    'api::collection.collection.find',
    'api::collection.collection.findOne',
    'api::page.page.find',
    'api::page.page.findOne',
  ];
  
  for (const permission of permissions) {
    await sql.query(`
      INSERT INTO "admin-permission-action" (action, action_parameters, conditions, subject, role_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (action, subject, role_id) DO NOTHING
    `, [permission, '{}', '{}', permission.split('.')[1], publicRoleId]);
  }
  
  console.log(`   ✅ Configured ${permissions.length} public permissions`);
}

seedProduction();