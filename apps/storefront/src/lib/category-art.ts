/** Complete UAVs have their own listing page; every other category filters /parts. */
export const categoryHref = (node: { name: string; handle: string }) =>
  /uav|drone/i.test(node.name) ? "/uavs" : `/parts?category=${node.handle}`;
