/**
 * Development seed script — creates a small realistic UAV catalog.
 * Run: npx ts-node --esm src/scripts/seed-dev.ts
 * Reset: npx ts-node --esm src/scripts/seed-dev.ts --reset
 *
 * All seeded data uses [DEV] prefix for easy identification and cleanup.
 */

const BASE = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL || "admin@skyrostore.com";
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || "admin123";

const SALES_CHANNEL_ID = "sc_01M4EBQHND0ZJQDF5WFTWR8DAF";
const REGION_ID = "reg_01M4EBVQ7AW00SGW5JEMPAABK3";
const STOCK_LOCATION_ID = "sloc_01M4EC3248M97C1NT360HXMVY6";
const SHIPPING_PROFILE_ID = "sp_01M4EBB1W71ZNYR2S136DKY4TA";

interface ApiResponse {
  [key: string]: unknown;
}

let token = "";

async function api(
  path: string,
  method = "GET",
  body?: unknown
): Promise<ApiResponse> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  }
  if (res.status === 204) return {};
  return res.json();
}

async function authenticate() {
  const data = await api("/auth/user/emailpass", "POST", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  token = data.token as string;
  console.log("Authenticated as admin");
}

// ── Categories ──────────────────────────────────────────────────────

const CATEGORIES = [
  { name: "[DEV] Complete UAVs", handle: "dev-complete-uavs" },
  { name: "[DEV] Flight Controllers", handle: "dev-flight-controllers" },
  { name: "[DEV] ESCs", handle: "dev-escs" },
  { name: "[DEV] Motors", handle: "dev-motors" },
  { name: "[DEV] Propellers", handle: "dev-propellers" },
  { name: "[DEV] GPS Modules", handle: "dev-gps-modules" },
  { name: "[DEV] Batteries", handle: "dev-batteries" },
  { name: "[DEV] Frames", handle: "dev-frames" },
];

async function seedCategories(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const cat of CATEGORIES) {
    try {
      const data = await api("/admin/product-categories", "POST", {
        name: cat.name,
        handle: cat.handle,
        is_active: true,
        is_internal: false,
      });
      const created = data.product_category as { id: string };
      map.set(cat.handle, created.id);
      console.log(`  Category: ${cat.name} -> ${created.id}`);
    } catch (e: unknown) {
      const msg = (e as Error).message;
      if (msg.includes("409") || msg.includes("already exists") || msg.includes("unique")) {
        const list = await api(
          `/admin/product-categories?handle=${cat.handle}&limit=1`
        );
        const cats = list.product_categories as { id: string }[];
        if (cats.length) {
          map.set(cat.handle, cats[0].id);
          console.log(`  Category exists: ${cat.name} -> ${cats[0].id}`);
        }
      } else {
        throw e;
      }
    }
  }
  return map;
}

// ── Products ────────────────────────────────────────────────────────

interface ProductDef {
  title: string;
  handle: string;
  description: string;
  categoryHandle: string;
  sku: string;
  priceINR: number; // in rupees
  weight: number; // grams
  thumbnail?: string;
  metadata: Record<string, string>;
}

const PRODUCTS: ProductDef[] = [
  {
    title: "[DEV] SkyroX4 Quadcopter",
    handle: "dev-skyrox4-quadcopter",
    description:
      "Pre-assembled quadcopter platform. 450mm wheelbase, carbon fiber frame, integrated flight controller. Max takeoff weight 2.5kg.",
    categoryHandle: "dev-complete-uavs",
    sku: "DEV-UAV-X4-001",
    priceINR: 89999,
    weight: 1450,
    metadata: {
      uav_class: "Micro",
      max_takeoff_weight_g: "2500",
      wheelbase_mm: "450",
      frame_material: "Carbon Fiber",
      flight_time_min: "28",
    },
  },
  {
    title: "[DEV] Pixhawk 6C Mini",
    handle: "dev-pixhawk-6c-mini",
    description:
      "Compact flight controller with STM32H743 processor. Supports ArduPilot and PX4. Triple-redundant IMU.",
    categoryHandle: "dev-flight-controllers",
    sku: "DEV-FC-PX6C-001",
    priceINR: 14999,
    weight: 38,
    thumbnail: "/images/products/pixhawk-6c-mini.webp",
    metadata: {
      component_type: "FLIGHT_CONTROLLER",
      weight_g: "38",
      processor: "STM32H743",
      firmware_support: "ArduPilot, PX4",
      imu_count: "3",
      uart_count: "6",
    },
  },
  {
    title: "[DEV] BLHeli32 4-in-1 ESC 50A",
    handle: "dev-blheli32-4in1-esc",
    description:
      "4-in-1 electronic speed controller. 50A continuous per channel, BLHeli_32 firmware, DShot1200.",
    categoryHandle: "dev-escs",
    sku: "DEV-ESC-BH32-001",
    priceINR: 7499,
    weight: 62,
    metadata: {
      component_type: "ESC",
      weight_g: "62",
      continuous_current_a: "50",
      peak_current_a: "55",
      cell_count_min: "3",
      cell_count_max: "6",
      firmware: "BLHeli_32",
      protocol: "DShot1200",
    },
  },
  {
    title: "[DEV] T-Motor U5 KV400",
    handle: "dev-tmotor-u5-kv400",
    description:
      "High-efficiency brushless motor for multirotors. 400KV, 28-pole, single-strand winding.",
    categoryHandle: "dev-motors",
    sku: "DEV-MOT-U5-001",
    priceINR: 5999,
    weight: 95,
    metadata: {
      component_type: "MOTOR",
      weight_g: "95",
      kv: "400",
      max_current_a: "25",
      recommended_voltage_min_v: "14.8",
      recommended_voltage_max_v: "25.2",
      recommended_propeller_min_in: "13",
      recommended_propeller_max_in: "16",
      poles: "28",
      max_thrust_g: "1800",
    },
  },
  {
    title: "[DEV] Carbon Fiber Propeller Set 15x5.5",
    handle: "dev-cf-prop-15x55",
    description:
      "Pair of carbon fiber propellers, 15-inch diameter, 5.5-inch pitch. CW/CCW matched set.",
    categoryHandle: "dev-propellers",
    sku: "DEV-PROP-CF15-001",
    priceINR: 2499,
    weight: 42,
    metadata: {
      component_type: "PROPELLER",
      weight_g: "21",
      diameter_in: "15",
      pitch_in: "5.5",
      material: "Carbon Fiber",
    },
  },
  {
    title: "[DEV] uBlox M10 GPS Module",
    handle: "dev-ublox-m10-gps",
    description:
      "Multi-constellation GNSS receiver. GPS, GLONASS, Galileo, BeiDou. Integrated compass.",
    categoryHandle: "dev-gps-modules",
    sku: "DEV-GPS-M10-001",
    priceINR: 4999,
    weight: 25,
    metadata: {
      component_type: "GPS",
      weight_g: "25",
      constellations: "GPS, GLONASS, Galileo, BeiDou",
      update_rate_hz: "10",
      accuracy_m: "1.5",
      compass: "IST8310",
    },
  },
  {
    title: "[DEV] LiPo 6S 5000mAh 50C",
    handle: "dev-lipo-6s-5000",
    description:
      "6-cell lithium polymer battery. 22.2V nominal, 5000mAh capacity, 50C continuous discharge.",
    categoryHandle: "dev-batteries",
    sku: "DEV-BAT-6S50-001",
    priceINR: 8999,
    weight: 680,
    metadata: {
      component_type: "BATTERY",
      weight_g: "680",
      cell_count: "6",
      voltage_v: "22.2",
      capacity_mah: "5000",
      continuous_discharge_a: "250",
      connector: "XT60",
    },
  },
  {
    title: "[DEV] X450 Carbon Frame Kit",
    handle: "dev-x450-carbon-frame",
    description:
      "450mm quadcopter frame. 3K carbon fiber arms, CNC aluminum center plates, integrated PDB.",
    categoryHandle: "dev-frames",
    sku: "DEV-FRM-X450-001",
    priceINR: 6499,
    weight: 320,
    metadata: {
      component_type: "FRAME",
      weight_g: "320",
      motor_count: "4",
      wheelbase_mm: "450",
      max_propeller_size_in: "15",
      max_takeoff_weight_g: "2500",
      arm_material: "3K Carbon Fiber",
      center_plate: "CNC Aluminum",
    },
  },
];

async function seedProducts(categoryMap: Map<string, string>) {
  for (const p of PRODUCTS) {
    const categoryId = categoryMap.get(p.categoryHandle);
    if (!categoryId) {
      console.error(`  No category for ${p.categoryHandle}, skipping ${p.title}`);
      continue;
    }

    // Check if exists
    const existing = await api(`/admin/products?handle=${p.handle}&limit=1`);
    const existingProducts = existing.products as { id: string }[];
    if (existingProducts.length > 0) {
      console.log(`  Product exists: ${p.title}`);
      continue;
    }

    // Create product with variant and pricing
    const data = await api("/admin/products", "POST", {
      title: p.title,
      handle: p.handle,
      description: p.description,
      status: "published",
      weight: p.weight,
      thumbnail: p.thumbnail,
      metadata: p.metadata,
      categories: [{ id: categoryId }],
      sales_channels: [{ id: SALES_CHANNEL_ID }],
      options: [{ title: "Default", values: ["Standard"] }],
      variants: [
        {
          title: "Standard",
          sku: p.sku,
          manage_inventory: true,
          prices: [
            {
              amount: p.priceINR * 100, // Medusa stores in lowest currency unit (paise)
              currency_code: "inr",
              region_id: REGION_ID,
            },
          ],
          options: { Default: "Standard" },
        },
      ],
    });

    const product = data.product as { id: string; variants?: { id: string }[] };
    console.log(`  Product: ${p.title} -> ${product.id}`);

    // Link to shipping profile
    await api(`/admin/products/${product.id}`, "POST", {
      shipping_profile_id: SHIPPING_PROFILE_ID,
    });

    // Set inventory for variant
    if (product.variants?.length) {
      const variantId = product.variants[0].id;
      try {
        // Get inventory item linked to this variant
        const invList = await api(
          `/admin/inventory-items?sku=${p.sku}&limit=1`
        );
        const items = invList.inventory_items as { id: string }[];
        if (items.length) {
          // Create inventory level at stock location
          try {
            await api(
              `/admin/inventory-items/${items[0].id}/location-levels`,
              "POST",
              {
                location_id: STOCK_LOCATION_ID,
                stocked_quantity: 10,
              }
            );
            console.log(`    Inventory set: 10 units at warehouse`);
          } catch (e: unknown) {
            const msg = (e as Error).message;
            if (msg.includes("already") || msg.includes("409")) {
              console.log(`    Inventory level already exists`);
            } else {
              console.error(`    Inventory error: ${msg}`);
            }
          }
        }
      } catch (e) {
        console.error(`    Inventory lookup failed: ${(e as Error).message}`);
      }
    }
  }
}

// ── Reset ───────────────────────────────────────────────────────────

async function reset() {
  console.log("Resetting [DEV] seed data...");

  // Delete products
  const prodList = await api(`/admin/products?q=%5BDEV%5D&limit=50`);
  const products = prodList.products as { id: string; title: string }[];
  for (const p of products) {
    await api(`/admin/products/${p.id}`, "DELETE");
    console.log(`  Deleted product: ${p.title}`);
  }

  // Delete categories
  const catList = await api(
    `/admin/product-categories?q=%5BDEV%5D&limit=50`
  );
  const cats = catList.product_categories as { id: string; name: string }[];
  for (const c of cats) {
    await api(`/admin/product-categories/${c.id}`, "DELETE");
    console.log(`  Deleted category: ${c.name}`);
  }

  console.log("Reset complete.");
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const isReset = process.argv.includes("--reset");

  await authenticate();

  if (isReset) {
    await reset();
    return;
  }

  console.log("Seeding categories...");
  const categoryMap = await seedCategories();

  console.log("Seeding products...");
  await seedProducts(categoryMap);

  console.log("\nSeed complete. 8 products created with inventory.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
