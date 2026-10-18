# Saraha App 💬

A RESTful backend for an **anonymous messaging** application. Anyone can send a message to a registered user, with or without logging in, and users can read and manage the messages they receive.

Built with **Node.js**, **Express 5**, **MongoDB** and **Redis**, with email OTP verification, Google sign-in, JWT authentication with refresh and revoke support, file uploads, and Redis-backed rate limiting.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Deployment](#deployment)
- [Author](#author)

---

## Features

**Authentication & security**
- Sign up with email and password (password hashed with bcrypt, phone number encrypted with AES-256-CBC)
- Email confirmation with a 6-digit OTP (stored hashed in Redis, with expiry and a limit on resend attempts)
- Sign up / sign in with **Google** (ID token verification)
- JWT **access and refresh tokens**, with separate secrets per role (user / admin)
- Token rotation, logout from the current device or from **all devices**
- Forgot / reset password flow with OTP
- Role-based authorization (`USER`, `ADMIN`)
- Request validation with **Zod**, with English and Arabic error messages
- Security headers with **Helmet**, request logging with **Morgan**

**Messaging**
- Send a message anonymously, or while logged in
- Attach up to 3 images per message
- List received, sent, or all messages, with pagination
- Read or delete a single message (receiver only)

**Other**
- Profile image upload (JPEG / PNG / GIF, validated by file signature, not just by extension)
- Redis-backed rate limiting, with a stricter limiter on login
- Centralized error handling and a consistent response format

---

## Tech Stack

| Area | Technology |
|---|---|
| Runtime | Node.js 22 (ES modules) |
| Framework | Express 5 |
| Database | MongoDB with Mongoose |
| Cache / OTP / rate limit | Redis |
| Validation | Zod |
| Auth | jsonwebtoken, bcrypt, google-auth-library |
| Uploads | Multer, file-type |
| Email | Nodemailer (Gmail SMTP) |
| Security | Helmet, CORS, express-rate-limit |
| Process manager | PM2 |

---

## Project Structure

```
src/
├── main.js                  # App setup: middleware, routes, error handling
├── config.js                # Reads .env.<NODE_ENV> and exports configuration
├── DB/
│   ├── connection.db.js     # MongoDB + Redis bootstrap
│   ├── redis.connection.js
│   └── model/               # user.model.js, message.model.js
├── middleware/
│   ├── authentication.middleware.js   # authentication + authorization
│   ├── validation.middleware.js       # Zod validation
│   ├── multer.middleware.js           # upload + file-type check
│   └── error.middleware.js
├── common/
│   ├── repository/          # Generic database helpers (find, paginate, create, ...)
│   ├── security/            # hash, encryption, token helpers
│   ├── services/            # Redis cache service
│   ├── utils/               # limiter, email, OTP, multer helpers, responses
│   ├── enum/  exceptions/  events/  validation.js
└── modules/
    ├── auth/                # signup, login, OTP, password reset, Google
    ├── user/                # profile, logout, token rotation, profile image
    └── message/             # send, list, read, delete messages
```

Each module follows the same flow: **controller → validation → service → repository**.

---

## Getting Started

### Prerequisites

- Node.js `22.x`
- A running **MongoDB** instance (local or Atlas)
- A running **Redis** instance
- A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) for sending emails
- A Google OAuth **Web Client ID** (only for Google sign-in)

### Installation

```bash
git clone https://github.com/<your-username>/SarahaApp_v4.git
cd SarahaApp_v4
npm install
```

Create the environment file (see [Environment Variables](#environment-variables)):

```bash
cp .env.example .env.development
```

### Run

```bash
# development (auto-restart on changes)
npm run start:dev

# production (PM2 in cluster mode)
npm run start:prod
```

The API listens on the port set in `PORT`. A health check is available at `GET /`.

---

## Environment Variables

The app loads `.env.<NODE_ENV>` (`.env.development` by default, `.env.production` in production). These files are ignored by git, so create them yourself.

```env
# Server
PORT=3001
ORIGINS=http://localhost:3000,https://your-frontend.com

# Databases
DB_URI=mongodb://127.0.0.1:27017/saraha
REDIS_URI=redis://127.0.0.1:6379

# Encryption (phone numbers)
ENC_KEY=<32-character secret>
IV_LENGTH=16

# JWT secrets (use long random strings, all different)
ACCESS_USER_TOKEN_SIGNATURE=
ACCESS_ADMIN_TOKEN_SIGNATURE=
REFRESH_USER_TOKEN_SIGNATURE=
REFRESH_ADMIN_TOKEN_SIGNATURE=

# Token lifetimes in seconds
ACCESS_TOKEN_EXPIRESIN=1800
REFRESH_TOKEN_EXPIRESIN=86400

# Google sign-in (comma-separated list of client IDs)
WEB_CLIENT_IDS=

# Email (Gmail SMTP)
APP_EMAIL=
APP_PASSWORD=

# Links used in email templates
INSTGRAM_LINK=
TWITTER_LINK=
FACEBOOK_LINK=
```

> Never commit real secrets. Generate secrets with  
> `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

---

## API Reference

All responses use the same shape:

```json
{ "message": "Done", "status": 200, "data": { } }
```

Errors return the matching HTTP status with `error_message` and, for validation errors, an `issues` array.

Send `Accept-Language: 1` for English validation messages or `0` for Arabic.

### Auth — `/auth`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/signup` | Create an account and send a confirmation OTP |
| `POST` | `/auth/signup-with-gmail` | Sign up or log in with a Google `idToken` |
| `POST` | `/auth/login` | Log in, returns `access_token` and `refresh_token` |
| `PATCH` | `/auth/confirm-email` | Confirm email with `{ email, otp }` |
| `PATCH` | `/auth/resend-confirm-email` | Send a new confirmation OTP |
| `POST` | `/auth/forget-password` | Send a password reset OTP |
| `POST` | `/auth/verify-forgot-password` | Check the reset OTP |
| `PATCH` | `/auth/reset-forgot-password` | Set a new password |

<details>
<summary><b>Signup body</b></summary>

```json
{
  "username": "Yousab Mounir",
  "email": "user@example.com",
  "confirmEmail": "user@example.com",
  "password": "Password@123",
  "confirmPassword": "Password@123",
  "phone": "+201234567890",
  "gender": 0,
  "role": 0
}
```

- `username`: first and last name separated by a space
- `password`: 8–16 characters with a lowercase letter, an uppercase letter, a digit and a special character
- `phone`: international (E.164) format
- `gender`: `0` male, `1` female (optional) · `role`: `0` user, `1` admin
</details>

<details>
<summary><b>Login</b></summary>

```http
POST /auth/login?lang=en
Content-Type: application/json

{ "email": "user@example.com", "password": "Password@123" }
```

Response:

```json
{
  "message": "Done",
  "status": 200,
  "data": { "access_token": "…", "refresh_token": "…" }
}
```
</details>

### User — `/user`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/user` | Access token | Get the current profile |
| `PATCH` | `/user` | Access token | Update the profile |
| `POST` | `/user/logout` | Access token | Body `{ "action": 0 }` logs out this device, `{ "action": 1 }` logs out all devices |
| `POST` | `/user/rotate-token` | Refresh token | Get a new token pair |
| `PATCH` | `/user/profile-image` | Access token | Upload a profile image (`multipart/form-data`, field `attachment`, max 2 MB) |

### Messages — `/message`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/message` | Optional | Send a message. Without a token the message is anonymous |
| `GET` | `/message` | Access token | List messages. Query: `type` (`received` · `sent` · `both`), `page`, `limit` |
| `GET` | `/message/:messageId` | Access token | Get one received message |
| `DELETE` | `/message/:messageId` | Access token | Delete one received message |

<details>
<summary><b>Send a message</b></summary>

`multipart/form-data`:

| Field | Type | Notes |
|---|---|---|
| `receiverId` | text | Required. The receiver's user ID |
| `content` | text | 2–50,000 characters |
| `attachments` | file(s) | Up to 3 images (JPEG, PNG or GIF) |

Add `Authorization: Bearer <access_token>` to send the message with your identity attached. Leave it out to send anonymously.
</details>

---

## Authentication

Protected routes expect the access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

- **Access token**: short-lived (30 minutes by default)
- **Refresh token**: used only on `POST /user/rotate-token`
- **Logout** revokes the token's ID in Redis. **Logout from all devices** and **password reset** invalidate every older token

---

## Rate Limiting

Limits are enforced per IP address and stored in Redis, so they are shared across all PM2 cluster workers.

- A **global limiter** protects every route
- A stricter **login limiter** allows 5 failed attempts per 5 minutes; successful logins don't count against it
- OTP requests are limited to 3 per account, then blocked for 5 minutes

When a limit is hit the API responds with `429 Too Many Requests`.

---

## Deployment

The app runs behind **nginx** as a reverse proxy, managed by **PM2** on an AWS EC2 (Ubuntu) instance.

```bash
# on the server
npm install --omit=dev
NODE_ENV=production pm2 start src/main.js -i max --name saraha
pm2 save && pm2 startup
```

Example nginx server block (the app listens on port `3001`):

```nginx
server {
    listen 80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

The `X-Forwarded-For` header lets the app see the real client IP, which the rate limiter relies on (`trust proxy` is set to `1`). Add HTTPS with Let's Encrypt (`certbot --nginx`) once you have a domain name.

---

## Author

**Yousab Mounir** — Computer Science student, Cairo University

- GitHub: yousab-mounir25
- LinkedIn:www.linkedin.com/in/yousab-mounir-7b89852b0
