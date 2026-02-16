# Serra E-Commerce Backend (TypeScript)

Enterprise-grade, Event-Driven, Modular Backend for Fashion E-Commerce. Built with **Node.js**, **Express**, **TypeScript**, and **MongoDB**.

---

## 🛠 Tech Stack

-   **Runtime**: Node.js (Latest LTS)
-   **Language**: TypeScript v5+
-   **Framework**: Express.js
-   **Database**: MongoDB Atlas + Mongoose (Strict Typed)
-   **Validation**: Zod (Schema Validation)
-   **Authentication**: JWT (Access + Refresh Tokens)
-   **Security**: Helmet, CORS, XSS-Clean, Rate Limiting
-   **Architecture**: Modular + Event-Driven (Internal Event Bus)
-   **Logging**: Custom Logger / Morgan

---

## � Getting Started

### 1. Prerequisites
-   Node.js installed (v18+)
-   MongoDB Atlas Cluster or Local MongoDB

### 2. Installation
Clone the repo and install dependencies:
```bash
git clone <repo-url>
cd Serra_BE
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (copied from `.env.example`).
**Note:** If your password has special characters like `@`, URL encode them (e.g., `@` -> `%40`).

```properties
PORT=5002
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.example.mongodb.net/serra-db
JWT_ACCESS_SECRET=super_secret_access_key
JWT_REFRESH_SECRET=super_secret_refresh_key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

### 4. Running the Server

**Development (Hot Reload):**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm start
```

---

## 📚 API Documentation

Base URL: `http://localhost:5002/api/v1`

### 🔐 Auth Module

#### 1. Register User
**POST** `/auth/register`

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | string | Yes | Full Name |
| `email` | string | Yes | Unique Email Address |
| `password` | string | Yes | Min 8 chars |
| `role` | string | No | `customer` (default), `vendor`, `admin` |

**Response (201 Created):**
```json
{
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "isEmailVerified": false,
      "_id": "65b9...",
      "createdAt": "2024-01-31T..."
    },
    "tokens": {
      "access": "eyJhbG...",
      "refresh": "eyJhbG..."
    }
  },
  "success": true
}
```

#### 2. Login User
**POST** `/auth/login`

**Payload:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": {
      "access": "eyJhb...",
      "refresh": "eyJhb..."
    }
  },
  "success": true
}
```

---

### � User Module

#### 1. Get Profile
**GET** `/users/profile`
**Headers:** `Authorization: Bearer <access_token>`

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "User Profile",
  "data": {
    "sub": "65b9...",
    "role": "customer",
    "type": "access",
    "iat": 1706700000,
    "exp": 1706700900
  },
  "success": true
}
```

---

### 🛍️ Product Module

#### 1. Create Product (Admin/Vendor Only)
**POST** `/products`
**Headers:** `Authorization: Bearer <access_token>`

**Payload:**
```json
{
  "name": "Classic White T-Shirt",
  "slug": "classic-white-t-shirt",
  "description": "Premium cotton t-shirt.",
  "brand": "65ba...",
  "category": "65ba...",
  "basePrice": 1200,
  "discountPercentage": 10,
  "images": [
    { "imageUrl": "url1.jpg", "imagePublicId": "products/abc" },
    { "imageUrl": "url2.jpg", "imagePublicId": "products/xyz" }
  ],
  "variants": [
    {
      "sku": "TSH-WHT-S",
      "size": "S",
      "color": "White",
      "price": 1200,
      "stock": 50
    }
  ],
  "isPublished": true
}
```

**Response (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Product created successfully",
  "data": {
    "_id": "65bb...",
    "name": "Classic White T-Shirt",
    "finalPrice": 1080,
    ...
  },
  "success": true
}
```

#### 2. Get All Products
**GET** `/products?page=1&limit=10`

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "_id": "65bb...",
      "name": "Classic White T-Shirt",
      "brand": { "name": "Nike", ... },
      "category": { "name": "Men", ... },
      "finalPrice": 1080
    }
  ],
  "success": true
}
```

#### 3. Get Single Product
**GET** `/products/:slug`

---

## 🏗 System Architecture

### 📂 Folder Structure
```bash
src/
 ├── config/           # Environment variables & Validation
 ├── database/         # Database connection logic
 ├── events/           # Global Event Bus (Observer Pattern)
 ├── middlewares/      # Auth, Error, & Validation Middlewares
 ├── modules/          # Feature-based Modules
 │    ├── auth/        # Login, Register, Token Logic
 │    ├── user/        # User Model & Profile
 │    ├── product/     # Product Management
 │    ├── brand/       # Brand Model
 │    └── category/    # Category Model
 ├── utils/            # Helper classes (ApiResponse, Logger)
 ├── app.ts            # Express Application Setup
 ├── routes.ts         # Main Route Aggregator
 └── server.ts         # Server Entry Point
```

### 🔌 Event System
The application uses an internal **Event Emitter** to decouple logic.
-   **File**: `src/events/eventBus.ts`
-   **Usage**:
    -   `auth.service.ts` emits `user.created`
    -   `server.ts` listens to `user.created` to log or send welcome emails.

---

## 🧪 Testing

Run the included test script to verify all endpoints:
```bash
node scripts/test-api.js
```

---

## � Security Features
1.  **JWT**: Stateless authentication.
2.  **Helmet**: Secure HTTP Headers.
3.  **XSS-Clean**: Sanitizes user input.
4.  **CORS**: Restricts domain access.
5.  **Passwords**: Hashed using `bcrypt`.
