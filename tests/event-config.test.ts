import { describe, expect, it } from "vitest";
import { loadEventConfig, loadCategoriesConfig } from "@/lib/config/event-config";

describe("loadEventConfig", () => {
  it("carga y valida la configuración del evento de ejemplo", () => {
    const config = loadEventConfig("premios-nerea");
    expect(config.slug).toBe("premios-nerea");
    expect(config.name).toBe("Premios Nerea");
  });

  it("lanza un error legible si el evento no existe", () => {
    expect(() => loadEventConfig("evento-inexistente")).toThrow(
      /No se encontró configuración/
    );
  });
});

describe("loadCategoriesConfig", () => {
  it("carga las 8 categorías del evento de ejemplo con su orden", () => {
    const categories = loadCategoriesConfig("premios-nerea");
    expect(categories).toHaveLength(8);
    expect(categories[0].order).toBe(1);
  });
});
