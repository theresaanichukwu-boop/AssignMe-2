import { NextResponse } from "next/server";

// Digital Asset Links for the Android TWA (package com.assignme.app).
// Fingerprints come from ASSETLINKS_SHA256 (comma-separated, set where the
// release keystore fingerprint is known). Until then the file serves an empty
// list and the app opens as a Custom Tab — still fully usable.
export async function GET() {
  const fingerprints = (process.env.ASSETLINKS_SHA256 ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return NextResponse.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "com.assignme.app",
          sha256_cert_fingerprints: fingerprints,
        },
      },
    ],
    { headers: { "Content-Type": "application/json" } }
  );
}
