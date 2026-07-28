# AYSHO Bio - E-commerce Platform

A modern e-commerce platform for organic and natural products, built with React, Strapi v5, and TypeScript.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cloudflare CDN                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐    ┌───────▼───────┐    ┌───────▼───────┐
│ Cloudflare    │    │ Render        │    │ Neon          │
│ Pages         │◀──▶│ (Docker)      │◀──▶│ PostgreSQL    │
│ (Frontend)    │    │ (Backend)     │    │ (Database)    │
└───────────────┘    └───────┬───────┘    └───────────────┘
                             │
                    ┌────────▼────────┐
                    │ Cloudinary      │
                    │ (Media CDN)     │
                    └─────────────────┘
```

## 🚀 Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React + Vite + TypeScript | 18 / 5 / 5 |
| **Styling** | TailwindCSS | 3.4 |
| **Backend** | Strapi v5 | 5.51 |
| **Database** | PostgreSQL (Neon) | 15+ |
| **Media** | Cloudinary | Latest |
| **Hosting** | Cloudflare Pages + Render | Free Tier |
| **CI/CD** | GitHub Actions | Latest |
| **Monitoring** | Sentry + Better Stack | Free Tier |

## 📁 Project Structure

```
AYSHO/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── store/           # React Context state management
│   │   ├── data/            # Static data & types
│   │   └── App.tsx          # Main application
│   ├── public/
│   │   ├── _headers         # Cloudflare Pages headers
│   │   ├── _redirects       # Cloudflare Pages redirects
│   │   └── functions/       # Cloudflare Pages Functions
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                  # Strapi v5 application
│   ├── src/
│   │   ├── api/             # API endpoints (category, product, order, health)
│   │   ├── middlewares/     # Custom middlewares (compression, security, rate-limit)
│   │   ├── config/          # Strapi configuration
│   │   └── index.ts         # Bootstrap & lifecycle
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml        # Development environment
├── docker-compose.production.yml  # Production environment
├── .github/
│   └── workflows/           # CI/CD pipelines
├── docs/                    # Documentation
└── README.md
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git

### Quick Start

```bash
# Clone the repository
git clone https://github.com/king-wassim/AYSHO-Bio.git
cd AYSHO

# Start development environment
docker-compose up -d

# Or run manually:
# Terminal 1 - Backend
cd backend
cp .env.example .env
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:1337
- **Admin Panel**: http://localhost:1337/admin
- **Health Check**: http://localhost:1337/api/health

## 🔧 Configuration

### Environment Variables

#### Backend (`.env`)
```env
# Server
HOST=0.0.0.0
PORT=1337
NODE_ENV=development

# Database (SQLite for dev, PostgreSQL for prod)
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173

# Security Keys (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=xxx
ADMIN_JWT_SECRET=xxx
JWT_SECRET=xxx
TRANSFER_TOKEN_SALT=xxx
ENCRYPTION_KEY=xxx

# Cloudinary (Media)
UPLOAD_PROVIDER=local
CLOUDINARY_NAME=xxx
CLOUDINARY_KEY=xxx
CLOUDINARY_SECRET=xxx

# Sentry (Optional)
SENTRY_DSN=xxx
SENTRY_ENVIRONMENT=development
```

#### Frontend (`.env.local`)
```env
VITE_STRAPI_URL=http://localhost:1337
VITE_CLOUDINARY_CLOUD_NAME=xxx
VITE_SENTRY_DSN=xxx
```

### Generate Security Keys
```bash
# Generate all required keys
node -e "
const crypto = require('crypto');
console.log('APP_KEYS=' + Array(4).fill(0).map(() => crypto.randomBytes(32).toString('base64')).join(','));
console.log('API_TOKEN_SALT=' + crypto.randomBytes(32).toString('base64'));
console.log('ADMIN_JWT_SECRET=' + crypto.randomBytes(32).toString('base64'));
console.log('JWT_SECRET=' + crypto.randomBytes(32).toString('base64'));
console.log('TRANSFER_TOKEN_SALT=' + crypto.randomBytes(32).toString('base64'));
console.log('ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('base64'));
"
```

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d --build
```

### Production
```bash
# Build images
docker-compose -f docker-compose.production.yml build

# Run with environment file
docker-compose -f docker-compose.production.yml --env-file backend/.env.production up -d
```

## ☁️ Cloud Deployment

### 1. Neon PostgreSQL
1. Create account at [neon.tech](https://neon.tech)
2. Create project → Get connection string
3. Add to Render environment variables

### 2. Cloudinary
1. Create account at [cloudinary.com](https://cloudinary.com)
2. Get Cloud Name, API Key, API Secret
3. Add to Render & Cloudflare Pages environment variables

### 3. Render (Backend)
1. Connect GitHub repository
2. Create Web Service → Docker
3. Set environment variables from `.env.production`
4. Configure health check: `/api/health`

### 4. Cloudflare Pages (Frontend)
1. Connect GitHub repository
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add environment variables
5. Custom domain: `aysho.tn`

## 🔄 CI/CD Pipeline

The GitHub Actions workflow handles:
- ✅ Linting & Type Checking
- ✅ Unit & Integration Tests
- ✅ Docker Build Verification
- ✅ Security Scanning
- ✅ Automatic Deployment on merge to main

### Workflows
- **CI** (`.github/workflows/ci.yml`): Runs on every PR
- **CD** (`.github/workflows/cd.yml`): Deploys on merge to main

## 📚 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/categories` | List all categories | Public |
| GET | `/api/categories/:slug` | Get category by slug | Public |
| GET | `/api/products` | List products (with filters) | Public |
| GET | `/api/products/:id` | Get product details | Public |
| POST | `/api/orders` | Create order | Public |
| GET | `/api/health` | Health check | Public |
| GET | `/api/health/live` | Liveness probe | Public |
| GET | `/api/health/ready` | Readiness probe | Public |

## 🧪 Testing

```bash
# Frontend
cd frontend
npm run test          # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# Backend
cd backend
npm run test
```

## 🔒 Security

- **Helmet.js**: Security headers
- **CORS**: Configured for frontend domain
- **Rate Limiting**: 100 requests/15min per IP
- **JWT**: Secure token management
- **Content Security Policy**: Strict CSP headers
- **Secrets**: Managed via environment variables (never committed)

## 📊 Monitoring

- **Sentry**: Error tracking & performance monitoring
- **Better Stack**: Uptime monitoring & log management
- **Health Checks**: `/api/health`, `/api/health/live`, `/api/health/ready`

## 📖 Documentation

See the [`docs/`](./docs) folder for detailed guides:
- [Architecture](./docs/architecture.md)
- [Deployment](./docs/deployment.md)
- [Docker](./docs/docker.md)
- [Cloudflare Pages](./docs/cloudflare.md)
- [Render](./docs/render.md)
- [Cloudinary](./docs/cloudinary.md)
- [Neon PostgreSQL](./docs/neon.md)
- [GitHub Actions](./docs/github-actions.md)
- [Security](./docs/security.md)
- [Maintenance](./docs/maintenance.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Commit Convention
Follows [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Wassim** - [@king-wassim](https://github.com/king-wassim)

## 🙏 Acknowledgments

- [Strapi](https://strapi.io/) - Headless CMS
- [Cloudflare Pages](https://pages.cloudflare.com/) - Edge hosting
- [Render](https://render.com/) - Container hosting
- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [Cloudinary](https://cloudinary.com/) - Media management
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Vite](https://vitejs.dev/) - Build tool


