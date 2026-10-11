import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function pngSize(file: string): { w: number; h: number } {
  const b = fs.readFileSync(path.join(root, file));
  expect(b.slice(0, 4).toString("hex")).toBe("89504e47");
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

describe("PWA manifest (PRD §41)", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "public/manifest.webmanifest"), "utf8"));

  it("has required installability fields", () => {
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#0B1F3A");
    expect(manifest.background_color).toBe("#0B1F3A");
  });

  it("declares 192, 512, and maskable icons that exist at the right size", () => {
    const icons = manifest.icons as Array<{ src: string; sizes: string; purpose?: string }>;
    expect(icons.some((i) => i.sizes === "192x192")).toBe(true);
    expect(icons.some((i) => i.sizes === "512x512" && !i.purpose)).toBe(true);
    expect(icons.some((i) => i.purpose === "maskable")).toBe(true);
    for (const icon of icons) {
      const rel = icon.src.replace(/^\//, "");
      const { w, h } = pngSize(path.join("public", rel));
      const [ew, eh] = icon.sizes.split("x").map(Number);
      expect(w).toBe(ew);
      expect(h).toBe(eh);
    }
  });
});

describe("service worker (PRD §41)", () => {
  const sw = fs.readFileSync(path.join(root, "public/sw.js"), "utf8");

  it("never caches private API responses", () => {
    expect(sw).toMatch(/\/api\//);
    expect(sw).toMatch(/never cached|isApi/i);
  });

  it("has offline fallback and lifecycle handling", () => {
    expect(sw).toMatch(/\/offline/);
    expect(sw).toMatch(/skipWaiting/);
    expect(sw).toMatch(/clients\.claim/);
  });
});

describe("legal pages (APK store requirements)", () => {
  it("privacy and terms pages exist", () => {
    expect(fs.existsSync(path.join(root, "app/privacy/page.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(root, "app/terms/page.tsx"))).toBe(true);
  });
});
