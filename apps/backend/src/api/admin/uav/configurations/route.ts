import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { order_id } = req.query as { order_id?: string };

  const configuratorService = req.scope.resolve("configurator") as {
    listUavConfigurations: (filters?: Record<string, unknown>, config?: Record<string, unknown>) => Promise<unknown>;
    listUavConfigurationSnapshots: (filters?: Record<string, unknown>, config?: Record<string, unknown>) => Promise<unknown>;
  };

  if (order_id) {
    const result = await configuratorService.listUavConfigurationSnapshots(
      { order_id },
      { order: { created_at: "DESC" } }
    );
    const snapshots = Array.isArray(result)
      ? (Array.isArray(result[0]) ? result[0] : result)
      : result ? [result] : [];

    return res.json({ snapshots });
  }

  const result = await configuratorService.listUavConfigurations(
    {},
    { order: { created_at: "DESC" }, take: 50 }
  );
  const configs = Array.isArray(result)
    ? (Array.isArray(result[0]) ? result[0] : result)
    : result ? [result] : [];

  res.json({ configurations: configs, count: configs.length });
}
