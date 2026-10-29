# Land Hama-Ali Portfolio

## Run locally

Install the server dependencies and start the portfolio:

```powershell
npm install
npm start
```

Open `http://127.0.0.1:4173`. The server binds to localhost by default so booking data and the first admin setup are not exposed to your network.

## Admin setup

Open the three-line menu and choose **ADMIN LOGIN**. On first use, create a private username and a unique password with at least 12 characters. The password is stored as a salted hash in `.private/admin.json`; booking details and uploaded photos are stored in `.private/` and are not served as public files.

The admin panel lists requests and their private reference photos. Use each booking's controls to update its status and amount paid. Status and payment updates are saved to disk.

Keep the `.private/` folder backed up privately. It is excluded from Git. Do not delete it unless you intend to remove the admin account, bookings, and uploaded booking photos.

## Hosting later

Before making the site public, create the admin account while the server is bound to localhost. Deploy the server behind HTTPS, use persistent private disk storage for `.private/`, and restrict server and backup access. Set `HOST=0.0.0.0` only in the hosting environment after the admin account exists. The first-run setup endpoint rejects non-local connections. Do not deploy this as static-only hosting; booking submissions and the admin panel require the Node server.

## Update work links and thumbnails

In `script.js`, set each project's `thumbnail` to a local image path and `youtubeUrl` to its unlisted YouTube URL. A project card opens that URL directly. Until then, the card uses the existing placeholder artwork and is not linked to a fabricated video.