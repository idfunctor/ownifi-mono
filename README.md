# Ownifi

A modern web application that integrates with Spotify, built with SolidJS and Hono.

## Features

- Spotify Authentication
- User Management with Supabase
- Modern, responsive UI
- Secure session handling

## Prerequisites

- Node.js 18+ and Bun
- Supabase account
- Spotify Developer account

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ownifi.git
cd ownifi
```

2. Install dependencies:
```bash
bun install
```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the database migrations from `apps/ownifi-be/src/db/schema.sql`
   - Copy your project URL and keys

4. Set up Spotify:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new application
   - Add `http://localhost:3030/auth/callback/spotify` to the Redirect URIs
   - Copy your Client ID and Client Secret

5. Configure environment variables:
   - Copy `apps/ownifi-be/.env.example` to `apps/ownifi-be/.env`
   - Fill in your Supabase and Spotify credentials

6. Start the development servers:
```bash
# Start both frontend and backend
bun dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3030

## Project Structure

```
ownifi/
├── apps/
│   ├── ownifi-fe/          # Frontend (SolidJS)
│   │   ├── src/
│   │   │   ├── routes/     # Page components
│   │   │   └── components/ # Reusable components
│   │   └── ...
│   │
│   └── ownifi-be/          # Backend (Hono)
│       ├── src/
│       │   ├── routes/     # API routes
│       │   ├── services/   # Business logic
│       │   ├── db/         # Database schemas
│       │   └── config/     # Configuration
│       └── ...
└── ...
```

## Development

- Frontend is built with SolidJS and uses CSS modules for styling
- Backend uses Hono for the API and Supabase for database/auth
- Authentication flow uses Spotify OAuth 2.0

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
