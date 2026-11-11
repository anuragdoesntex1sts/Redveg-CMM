<div align="center">

# 🥬 RedVeg

### Fresh food commerce, from product discovery to doorstep delivery.

**A full-stack commerce and operations platform for fresh fish, poultry, and meat.**

<img src="https://readme-typing-svg.demolab.com?font=Inter&weight=600&size=18&pause=1400&color=2F855A&center=true&vCenter=true&width=720&height=36&lines=From+fresh+catalog+to+doorstep+delivery;One+connected+workspace+for+customers+and+teams;Built+for+the+rhythm+of+fresh-food+commerce" alt="From catalog to doorstep delivery — one connected commerce workspace" />

[![Node.js](https://img.shields.io/badge/Node.js-22-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4-111111?logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-2F855A.svg)](LICENSE)

<br />

**Storefront** · **Admin workspace** · **Commerce API** · **Delivery operations**

</div>

---

## ✨ What is RedVeg?

RedVeg brings the customer shopping journey and the day-to-day work of running a fresh-food business into one connected system. Customers can browse products and offers, build a cart, choose delivery details, and place orders. Staff can manage the catalog, orders, customers, promotions, delivery areas, and store settings through a protected admin workspace.

The platform is designed around the practical details of perishable commerce: availability, delivery coverage and slots, order review, payment confirmation, and clear customer communication.

## 🧭 How it works

```mermaid
flowchart LR
    C[🛒 Customer] -->|Browse & add items| W[RedVeg storefront]
    W -->|Catalog, offers, availability| API[Commerce API]
    W -->|Checkout details| API
    API --> CAT[(Catalog database)]
    API --> ORD[(Orders database)]
    API --> CUS[(Customer database)]
    API --> PAY[Payment services]
    API --> MSG[WhatsApp & email]
    API -->|Order queue| A[🧑‍💼 Admin workspace]
    A -->|Review, fulfill, update| API
    API -->|Status & updates| C

    classDef customer fill:#fff4e8,stroke:#e58a35,color:#3d2715,stroke-width:2px
    classDef app fill:#eef8ed,stroke:#4e9b5b,color:#183a20,stroke-width:2px
    classDef data fill:#edf4ff,stroke:#5584c3,color:#172d4c
    class C customer
    class W,API,A app
    class CAT,ORD,CUS data
```

### A typical order journey

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Store as Storefront
    participant API as RedVeg API
    participant Data as Commerce databases
    participant Team as Admin team
    Customer->>Store: Browse products and build cart
    Store->>API: Request catalog, offers, and delivery options
    API->>Data: Read current commerce data
    Data-->>API: Products, rules, and availability
    API-->>Store: Return checkout-ready information
    Customer->>Store: Submit order and payment choice
    Store->>API: Create checkout order
    API->>Data: Save customer and order records
    API-->>Team: Make order available for review
    Team->>API: Approve and update order status
    API-->>Customer: Share order updates
```

## 🧰 Product capabilities

| 🛍️ Customer experience | 🧑‍🍳 Store operations |
| --- | --- |
| Product catalog, categories, variants, and combos | Catalog, category, and image management |
| Search, product details, cart, and wishlist | Order review, manual orders, and status tracking |
| Offers, campaigns, and coupons | Staff accounts and permission-aware admin pages |
| Customer accounts and order history | Customer management and active-cart visibility |
| Delivery area and slot selection | Delivery areas, fees, and delivery slots |
| Razorpay checkout and WhatsApp-assisted flows | Payment review, business policies, and store settings |
| Responsive storefront and customer policies | SEO, banners, campaigns, and operational reporting |

> Feature availability depends on the environment configuration and enabled integrations.

## 🏗️ Architecture at a glance

```mermaid
flowchart TB
    subgraph Experience[Experience layer]
      SHOP[React storefront]
      ADMIN[React admin workspace]
    end
    subgraph Services[Application layer]
      HTTP[Express application]
      ROUTES[Versioned REST API]
      DOMAIN[Commerce services]
      JOBS[Scheduled jobs]
    end
    subgraph Integrations[Data & integrations]
      CATALOG[(Turso catalog DB)]
      CUSTOMERS[(Turso customer DB)]
      ORDERS[(Turso orders DB)]
      RZP[Razorpay]
      EMAIL[Email]
      WHATSAPP[WhatsApp]
      MEDIA[Persistent image storage]
    end
    SHOP --> HTTP
    ADMIN --> HTTP
    HTTP --> ROUTES --> DOMAIN
    DOMAIN --> CATALOG
    DOMAIN --> CUSTOMERS
    DOMAIN --> ORDERS
    DOMAIN --> RZP
    DOMAIN --> EMAIL
    DOMAIN --> WHATSAPP
    DOMAIN --> MEDIA
    JOBS --> ORDERS

    classDef front fill:#e9f7ed,stroke:#43905a,color:#15351d
    classDef backend fill:#f1efff,stroke:#7867b8,color:#241d49
    classDef store fill:#fff3e5,stroke:#d89240,color:#4a3016
    class SHOP,ADMIN front
    class HTTP,ROUTES,DOMAIN,JOBS backend
    class CATALOG,CUSTOMERS,ORDERS,RZP,EMAIL,WHATSAPP,MEDIA store
```

## 🗂️ Project map

```text
RedVeg/
├── server/                         Express backend
│   ├── api/v1/                     Versioned routes and controllers
│   ├── config/                     Environment and database setup
│   ├── middleware/                 Authentication, uploads, and errors
│   ├── services/                   Payments, delivery, orders, media, and more
│   ├── jobs/                       Scheduled maintenance jobs
│   └── server.js                   Backend entry point
├── frontend/redveg-commerce-ui/
│   ├── client/src/pages/           Storefront and admin screens
│   ├── client/src/components/      Shared UI and page components
│   ├── client/src/contexts/        Cart, auth, location, and campaign state
│   └── client/src/lib/             API clients and browser utilities
├── database/
│   ├── catalog-db/                 Catalog schema and seed data
│   ├── customer-db/                Customer schema and seed data
│   └── orders-db/                  Order schema and seed data
├── scripts/                        Data sync and maintenance utilities
├── test/                           Backend and integration tests
├── docs/                           Payment and operational notes
├── package.json                    Backend scripts and dependencies
└── pnpm-workspace.yaml             Workspace configuration
```

## ⚙️ Technology

| Layer | Tools |
| --- | --- |
| Backend | Node.js 22, Express 4 |
| Storefront and admin | React 19, TypeScript, Vite, Wouter |
| Data | Turso / libSQL, split by catalog, customer, and order concerns |
| Payments and messaging | Razorpay, WhatsApp-assisted checkout, email integration |
| Media | Image processing and persistent server-side image storage |
| Security | JWT and customer authentication, permission-aware admin routes, rate limiting |

## 🚀 Run locally

### Requirements

- Node.js 22
- npm for the backend, and pnpm for the frontend workspace
- Turso credentials for the database-backed flows you want to run

### 1. Configure the backend

```bash
npm install
Copy-Item .env.example .env
```

Fill in the required values in `.env`. Do not commit real credentials. At minimum, configure the database URLs and tokens used by your environment, and a strong `JWT_SECRET`. The app also supports settings such as `PORT`, `CORS_ORIGIN`, `UPLOADS_DIR`, `APP_PUBLIC_URL`, and payment or email provider credentials. Check [`.env.example`](.env.example) for the current variable names.

### 2. Start the API

```bash
npm start
```

The backend listens on `PORT` (default `3000`). Its health endpoint is:

```text
GET http://localhost:3000/api/v1/health/ping
```

### 3. Start the storefront

```bash
cd frontend/redveg-commerce-ui
pnpm install
pnpm dev
```

Vite serves the frontend at `http://localhost:5177`. Configure its API base URL and any authentication or map integrations in the appropriate local frontend environment file.

## 🧪 Useful commands

| From | Command | Purpose |
| --- | --- | --- |
| Repository root | `npm start` | Start the Express backend |
| Repository root | `npm run dev` | Start backend with nodemon |
| Repository root | `npm test` | Run Node.js test suite |
| Frontend directory | `pnpm dev` | Start the Vite development server |
| Frontend directory | `pnpm build` | Build frontend assets and its server bundle |
| Frontend directory | `pnpm check` | Type-check the frontend |

## 🔐 Deployment notes

The backend is configured for Node.js 22 hosting. Production deployments need the correct database credentials, JWT secret, public URL, allowed storefront origins, and persistent image storage. Keep `.env` files and production secrets out of source control. After deployment, check the runtime logs and call `/api/v1/health/ping` to confirm the API is available.

The frontend is a separate Vite application. Build and deploy it with the frontend's own environment settings, pointing its API client at the deployed backend.

## 👤 Built by

**RedVeg is built by [Anurag Naskar](https://github.com/anuragdoesntex1sts), Founder of [AIZEN TECHNOLOGIES](https://github.com/anuragdoesntex1sts).**

## 📄 License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE) for details.

<div align="center">

Made with care for better fresh-food commerce. 🥬

</div>
