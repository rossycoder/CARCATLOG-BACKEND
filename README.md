# Car Website Backend API

Backend API for the automotive marketplace built with Node.js, Express, and MongoDB.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- MongoDB connection string
- JWT secret key
- OAuth credentials (Google, Facebook, Apple)
- Frontend URL

### 3. Start the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication (Coming soon)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/facebook` - Facebook OAuth
- `GET /api/auth/apple` - Apple Sign In

### Cars (Coming soon)
- `GET /api/cars` - Get all cars with filters
- `GET /api/cars/:id` - Get specific car
- `POST /api/cars` - Create car (admin)
- `PUT /api/cars/:id` - Update car (admin)
- `DELETE /api/cars/:id` - Delete car (admin)

## Project Structure

```
backend/
├── server.js           # Main server file
├── package.json        # Dependencies
├── .env.example        # Environment variables template
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## Next Steps

1. Set up MongoDB connection
2. Create Mongoose models
3. Implement authentication
4. Build API endpoints
5. Add validation and error handling
