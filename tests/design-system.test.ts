import { describe, expect, it } from "vitest";
import {
  brandColors,
  breakpoints,
  fontWeights,
  radii,
  spacingScale,
  typeScale,
} from "../lib/design-tokens";

describe("design tokens (PRD §18)", () => {
  it("uses locked brand colors", () => {
    expect(brandColors.navy).toBe("#0B1F3A");
    expect(brandColors.teal).toBe("#0F766E");
    expect(brandColors.coral).toBe("#F97360");
  });

  it("covers the required type scale", () => {
    expect([...typeScale]).toEqual([12, 14, 16, 18, 20, 24, 28, 32, 40, 48]);
  });

  it("uses the 4px spacing system", () => {
    expect([...spacingScale]).toEqual([4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96]);
    for (const s of spacingScale) expect(s % 4).toBe(0);
  });

  it("covers radii and breakpoints", () => {
    expect(radii).toMatchObject({ sm: 6, md: 8, lg: 12, xl: 16 });
    expect([...breakpoints]).toEqual([640, 768, 1024, 1280, 1536]);
  });

  it("supports required font weights", () => {
    expect([...fontWeights]).toEqual([400, 500, 600, 700]);
  });
});
