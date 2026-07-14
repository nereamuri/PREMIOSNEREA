import { describe, expect, it } from "vitest";
import { generateVotingToken, isValidTokenFormat } from "@/lib/token";

describe("generateVotingToken", () => {
  it("genera tokens con formato UUID v4 válido", () => {
    const token = generateVotingToken();
    expect(isValidTokenFormat(token)).toBe(true);
  });

  it("genera tokens distintos en cada llamada (no correlativos)", () => {
    const tokens = new Set(
      Array.from({ length: 1000 }, () => generateVotingToken())
    );
    // Con 1000 generaciones de un espacio de 2^122, una colisión indicaría
    // un generador roto, no mala suerte.
    expect(tokens.size).toBe(1000);
  });
});

describe("isValidTokenFormat", () => {
  it("rechaza tokens adivinables o mal formados", () => {
    expect(isValidTokenFormat("1")).toBe(false);
    expect(isValidTokenFormat("participante-1")).toBe(false);
    expect(isValidTokenFormat("00000000-0000-0000-0000-000000000000")).toBe(
      false // válido como UUID pero no como v4 (nibble de versión incorrecto)
    );
  });
});
