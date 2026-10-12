# Android (TWA) packaging

The `android/` directory is a Trusted Web Activity wrapper around the
production PWA (`https://assignme-2-5vu5.vercel.app/`): package
`com.assignme.app`, brand icon + navy splash, version `1.0.<github run number>`.

## Automatic releases

Every push to `main` runs `.github/workflows/android.yml`: it builds a signed
release APK + AAB, uploads them as artifacts, and creates a GitHub Release
(`android-v1.0.<run>`) with both files attached.

## Stable signing (one-time setup, recommended)

Without secrets, each build signs with a fresh ephemeral key (installs fine,
but updates require uninstalling first). For stable, upgradeable releases:

1. On any machine with Java, create one keystore and keep it safe:
   `keytool -genkeypair -keystore assignme-release.keystore -alias assignme -keyalg RSA -keysize 2048 -validity 10950`
2. GitHub → repo → Settings → Secrets → Actions → add:
   `ANDROID_KEYSTORE_BASE64` (base64 of the file),
   `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.
3. Get its SHA-256 fingerprint:
   `keytool -list -v -keystore assignme-release.keystore`
   and set `ASSETLINKS_SHA256` to it in Vercel/Netlify (comma-separated if
   several). The app serves it at `/.well-known/assetlinks.json`, which
   promotes the app from Custom Tab to full verified TWA (no URL bar).

Never commit keystores or passwords — `android/*.keystore` is git-ignored.
