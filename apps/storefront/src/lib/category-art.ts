// Category pictures in public/images/products, matched by category name until the admin can upload them.
const ART: [RegExp, string][] = [
  [/uav|drone/i, "cat-complete-uavs"],
  [/flight|autopilot/i, "cat-flight-controllers"],
  [/esc|speed/i, "cat-escs"],
  [/motor|propulsion/i, "cat-motors"],
  [/prop/i, "cat-propellers"],
  [/batter|lipo/i, "cat-batteries"],
  [/gps|gnss|telemetry/i, "cat-gps"],
  [/frame/i, "cat-frames"],
];

export const categoryArt = (name: string) => {
  const hit = ART.find(([re]) => re.test(name))?.[1];
  return hit ? `/images/products/${hit}.png` : null;
};

/** Complete UAVs have their own listing page; every other category filters /parts. */
export const categoryHref = (node: { name: string; handle: string }) =>
  /uav|drone/i.test(node.name) ? "/uavs" : `/parts?category=${node.handle}`;
