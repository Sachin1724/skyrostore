import { medusa } from "@/lib/medusa";

export async function getRegions() {
  const { regions } = await medusa.store.region.list();
  return regions;
}

export async function getRegion(id: string) {
  const { region } = await medusa.store.region.retrieve(id);
  return region;
}
