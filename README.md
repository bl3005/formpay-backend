# FormPay — Backend

REST API and WebSocket server for FormPay, a full-stack form builder with simulated payment collection. Built with Node.js, Express, MongoDB, and Socket.IO.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) |
| Real-time | Socket.IO |
| Password hashing | bcryptjs |

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # Register, login
│   │   ├── formController.js   # Form CRUD + submissions
│   │   └── paymentController.js# Mock payment intent + confirm
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT verification
│   ├── models/
│   │   ├── User.js             # User schema
│   │   ├── Form.js             # Form + fields schema
│   │   ├── Submission.js       # Form submission schema
│   │   └── Payment.js          # Mock payment record schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── formRoutes.js
│   │   └── paymentRoutes.js
│   ├── socket.js               # Socket.IO setup with JWT auth
│   └── index.js                # Entry point
├── .env                        # Environment variables (do not commit)
└── package.json
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user | Public |
| POST | `/api/auth/login` | Login, returns JWT | Public |

### Forms
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/forms` | Get all forms for logged-in user | Private |
| POST | `/api/forms` | Create a new form | Private |
| GET | `/api/forms/public/:id` | Get a form for public filling | Public |
| GET | `/api/forms/:id` | Get a single form by ID | Private |
| PUT | `/api/forms/:id` | Update a form | Private |
| DELETE | `/api/forms/:id` | Delete a form | Private |
| POST | `/api/forms/:id/submit` | Submit a form response | Public |
| GET | `/api/forms/:id/submissions` | Get all submissions for a form | Private |

### Payments
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/payments/create-payment-intent` | Create a mock payment record | Public |
| POST | `/api/payments/:id/confirm` | Confirm payment with card details | Public |

---

## WebSocket Events

The server uses Socket.IO with JWT authentication. Each authenticated user joins a private room `user:<id>`.

| Event | Direction | Payload | Description |
|---|---|---|---|
| `submission:new` | Server → Client | `{ formId, submission, amount }` | Emitted to form owner when a new submission arrives |

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/form_builder
JWT_SECRET=your_strong_jwt_secret_here
```

For local development:
```env
MONGODB_URI=mongodb://localhost:27017/form_builder
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Run in development (auto-restarts on file change — requires Node 18+)
npm run dev

# Run in production
npm start
```

---

## Payment System

This project uses a **simulated payment gateway** — no third-party payment provider is required. The flow mirrors a real payment integration:

1. Client calls `create-payment-intent` → server creates a `Payment` record with status `pending`
2. Client submits card details to `confirm` endpoint → server runs Luhn checksum validation
3. On success, payment status is set to `succeeded`
4. `submitForm` verifies payment status server-side before accepting the submission

**Test card numbers:**
- `4242 4242 4242 4242` — always succeeds
- `4000 0000 0000 0002` — always declines
- Any other Luhn-valid number — succeeds

---

## Deployment (Render)

1. Push backend to a GitHub repo
2. Create a new **Web Service** on [Render](https://render.com)
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables in the Render dashboard (`MONGODB_URI`, `JWT_SECRET`, `PORT`)