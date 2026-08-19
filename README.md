# Deceptor 🎬

> **Upload videos. Get permanent links. Share forever.**

A full-stack video hosting platform where users upload a video (up to 3 hours), receive a permanent universal link, and anyone can stream it in original quality without downloading — on any browser, any device, forever.

---

## 🏗 Architecture

```
deceptor/
├── client/          # React + Vite frontend
└── server/          # Express.js backend API
```

**Deployment targets:**
| Service | Platform |
|---|---|
| Frontend | Vercel (static) |
| Backend API | Vercel (serverless) |
| Database | MongoDB Atlas |
| Video Storage | Cloudinary |
| Email | Brevo SMTP |

---

## ✨ Features

- **Permanent Links** — Every video gets a lifetime-active `/v/:shortId` URL
- **Direct Streaming** — Videos stream from Cloudinary in original quality
- **3-Step Signup** — OTP email verification → password set
- **Forgot Password** — Full OTP-based reset flow
- **Upload Progress** — Real-time XHR progress to Cloudinary (never touches Vercel)
- **Video History** — Paginated gallery of all uploads with thumbnails
- **Profile Management** — Avatar upload, bio, display name
- **Custom Video Player** — Dark-theme player with seek bar, volume, fullscreen
- **GSAP Animations** — Hero text reveal, scroll-triggered reveals, marquee
- **Lenis Smooth Scroll** — Physics-based smooth scrolling throughout
- **Android APK** — Capacitor wrapping for native WebView APK

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- Brevo SMTP credentials

### Backend

```bash
cd server
npm install
# Edit .env with your credentials (already pre-filled)
npm run dev
# → http://localhost:5001
```

### Frontend

```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

### Test the API

```bash
# Health check
curl http://localhost:5001/api/health

# Test OTP signup
curl -X POST http://localhost:5001/api/auth/signup/request-otp \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"your@email.com"}'
```

---

## 📱 Android APK (Capacitor)

```bash
cd client

# 1. Build the production bundle
npm run build

# 2. Initialize Capacitor (first time only)
npx cap init Deceptor app.deceptor.video

# 3. Add Android platform
npx cap add android

# 4. Sync web build into Android project
npx cap sync android

# 5. Open in Android Studio to build APK
npx cap open android
```

> **Requirements:** Android Studio, Java SDK 17+

---

## 🔑 Environment Variables

### Server (`server/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (5001) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `SMTP_HOST` | Brevo SMTP host |
| `SMTP_PORT` | Brevo SMTP port (587) |
| `SMTP_USER` | Brevo SMTP login |
| `SMTP_PASS` | Brevo SMTP key |
| `SMTP_FROM` | Sender email |
| `CLIENT_URL` | Frontend origin (for CORS) |

### Client (`client/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL |

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup/request-otp` | Send OTP to email |
| POST | `/api/auth/signup/verify-otp` | Verify signup OTP |
| POST | `/api/auth/signup/set-password` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password/request-otp` | Send reset OTP |
| POST | `/api/auth/forgot-password/verify-otp` | Verify reset OTP |
| POST | `/api/auth/forgot-password/reset` | Reset password |

### Videos
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/videos/presign-upload` | ✅ | Get Cloudinary upload params |
| POST | `/api/videos/confirm-upload` | ✅ | Save video after upload |
| GET | `/api/videos/status/:id` | ✅ | Poll processing status |
| GET | `/api/videos/my-history` | ✅ | User's video library |
| GET | `/api/videos/public/:shortId` | ❌ | Resolve public link |
| DELETE | `/api/videos/:id` | ✅ | Delete a video |

### User
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/user/me` | ✅ | Get current user |
| PUT | `/api/user/profile` | ✅ | Update profile |
| POST | `/api/user/avatar-presign` | ✅ | Get avatar upload params |

---

## 🎨 Design System

- **Colors:** Blue primary (`#2563eb`) + White background + Dark navy (`#0f172a`) text
- **Typography:** Sora (display headings) + Inter (body)
- **Animation:** GSAP + ScrollTrigger (hero, scroll reveals) + Framer Motion (page transitions) + Lenis (smooth scroll)
- **Components:** Custom CSS system (glass morphism, buttons, inputs, cards, progress bars, OTP inputs)

---

## 🚢 Deployment

### Vercel (Frontend + Backend)

1. Push both `client/` and `server/` to GitHub
2. Import project in Vercel
3. Frontend: set root directory to `client/`, build command `npm run build`, output dir `dist`
4. Backend: set root directory to `server/`, add all env vars from `server/.env`

### Environment for Production

Update `client/.env` or Vercel env vars:
```
VITE_API_URL=https://your-api.vercel.app
```

---

## 📁 Project Structure

```
client/src/
├── components/
│   ├── Navbar.jsx
│   └── ProtectedRoute.jsx
├── context/
│   └── AuthContext.jsx
├── lib/
│   ├── api.js         # Axios instance
│   └── utils.js       # Utilities
├── pages/
│   ├── LandingPage.jsx
│   ├── SignupPage.jsx
│   ├── LoginPage.jsx
│   ├── ForgotPasswordPage.jsx
│   ├── UserPanel.jsx
│   ├── UploadPage.jsx
│   ├── HistoryPage.jsx
│   ├── ProfilePage.jsx
│   └── PlaybackPage.jsx
├── App.jsx
└── main.jsx

server/
├── lib/
│   ├── db.js
│   ├── cloudinary.js
│   └── mailer.js
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
├── models/
│   ├── User.js
│   ├── Video.js
│   └── OTP.js
├── routes/
│   ├── auth.js
│   ├── videos.js
│   └── user.js
└── index.js
```
