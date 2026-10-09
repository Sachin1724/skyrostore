import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const configuratorService = req.scope.resolve("configurator") as {
    listUavConfigurations: (filters?: Record<string, unknown>, config?: Record<string, unknown>) => Promise<[unknown[], number]>;
  };

  const [configs, count] = await configuratorService.listUavConfigurations(
    {},
    { order: { created_at: "DESC" }, take: 50 }
  );

  res.json({ configurations: configs, count });
}
