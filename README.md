# CIPHER PWA

## Setup
1. Create a bot through Bale's bot management flow and copy its token.
2. Both participants should start/interact with the bot. Obtain the recipient chat ID from `getUpdates`.
3. Host the files on an HTTPS origin. Open the app and install it to the home screen if desired.
4. Enter `2580` in the calculator and press `=` to open the hidden area. Change the default PIN in `app.js` before deployment; it is an obscurity gate, not authentication.
5. In Setup, enter the bot token and the other participant's chat ID. Configure a bot/token per participant where possible. Use the same strong passphrase; it is requested each session and is not stored.

Messages are encrypted locally with AES-256-GCM. PBKDF2-SHA-256 with 250,000 iterations derives keys from the shared passphrase and a random per-message salt. Envelopes contain version, IV, salt and ciphertext in base64. Encrypted records persist in IndexedDB.

The app polls Bale `getUpdates` while chat is unlocked (every five seconds) and sends through `sendMessage`; it does not provide background push. Notifications are optional and appear only while the app is open with permission granted. Bale updates and polling offsets are shared per bot token, so separate bots/tokens are recommended. Requests go directly from the browser to Bale and require network/CORS support. Never share bot tokens. The calculator PIN is not security, and calculator mode does not protect local device or browser storage. Losing the passphrase means encrypted message history cannot be recovered.
