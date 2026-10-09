import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id;
  if (!customerId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const id = req.params.id;
  const configuratorService = req.scope.resolve("configurator") as {
    retrieveUavConfiguration: (id: string, config?: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
    listUavConfigurationItems: (filters?: Record<string, unknown>) => Promise<[unknown[], number]>;
  };

  try {
    const config = await configuratorService.retrieveUavConfiguration(id);
    if (!config) {
      return res.status(404).json({ error: "Configuration not found" });
    }

    if (config.customer_id !== customerId) {
      return res.status(404).json({ error: "Configuration not found" });
    }

    const [items] = await configuratorService.listUavConfigurationItems({
      configuration_id: id,
    });

    res.json({ configuration: { ...config, items } });
  } catch {
    return res.status(404).json({ error: "Configuration not found" });
  }
}
