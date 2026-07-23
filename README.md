# Local TV Time 📺

A self-hosted, private TV show tracking application built as a modern alternative to apps like TV Time. Keep track of what you're watching, what you've finished, and get notified when new episodes drop—all on your own server.

![Local TV Time Demo](./public/icons/icon-192.png)

## Features
- **Track TV Shows:** Search and add shows using The Movie Database (TMDB) API.
- **Smart Tracking:** Automatically organizes shows into *Watching*, *Up to Date*, *Finished*, or *Dropped*.
- **Push Notifications:** Get alerted in your browser or phone when a new episode airs.
- **Custom Lists:** Organize your shows exactly how you want.
- **Privacy First:** Self-hosted with a local SQLite database. No data sharing. No ads.
- **Progressive Web App (PWA):** Installable on iOS and Android devices directly from your browser.
- **Import/Export:** Back up your entire library to a `.json` file at any time.

---

## Deployment (Docker)

The absolute easiest way to deploy this application on a VPS or home server is using Docker Compose.

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/local-tv-time.git
cd local-tv-time
```

### 2. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```
Edit the `.env` file and fill in your details:
- Get your **TMDB API Key** from [themoviedb.org](https://www.themoviedb.org/settings/api).
- Generate a random string for your **JWT_SECRET**.
- Generate VAPID keys for push notifications by running `npx web-push generate-vapid-keys` and paste them into the `.env` file.

### 3. Start the Server
Run Docker Compose:
```bash
docker compose up -d --build
```
The app will be available on port `3000`. We recommend putting it behind a reverse proxy like Caddy or Nginx to serve it over HTTPS (which is **required** for Push Notifications and PWA installation).

### Alternative: Deployment with Tailscale (Private HTTPS/VPN)

If you don't want to expose your app to the public internet but still want HTTPS (required for Push Notifications and PWA installation), you can deploy using the dedicated Tailscale sidecar file.

1. **Configure Tailscale Auth:**
   Generate a Tailscale auth key in your [Tailscale Console](https://login.tailscale.com/admin/settings/keys) and add it to your `.env` file:
   ```env
   TS_AUTHKEY=tskey-auth-your-key-here
   ```

2. **Start the Tailscale Stack:**
   ```bash
   docker compose -f docker-compose.tailscale.yml up -d
   ```

3. **Log in / Verify Connection:**
   If your auth key wasn't supplied or has expired, you can log in interactively by running:
   ```bash
   docker exec -it tailscale-tvtime tailscale up --accept-dns=false
   ```
   *(Click the login link printed in the terminal to authorize the container).*

4. **Enable Tailscale Serve (HTTPS):**
   Instruct the Tailscale sidecar to serve HTTPS (port 443) and proxy it to Next.js in the background:
   ```bash
   docker exec -it tailscale-tvtime tailscale serve --bg http://localhost:3000
   ```

Your app will now be securely available on your tailnet at `https://pi-tvtime.<your-tailnet-name>.ts.net/` with a valid SSL certificate.

---

## Local Development

If you want to run the project locally for development or customization:

```bash
# Install dependencies
npm install

# Setup your local .env file
cp .env.example .env

# Run database migrations
npx prisma db push

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Tech Stack
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Database:** SQLite via [Prisma ORM](https://www.prisma.io/)
- **UI:** Custom CSS / Lucide React Icons
- **Data Source:** [TMDB API](https://developer.themoviedb.org/reference/intro/getting-started)
