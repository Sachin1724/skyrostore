const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../.screenshots_9_screens');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const SCREENS = [
  { name: '01_storefront_homepage.png', url: 'http://localhost:3000/' },
  { name: '02_parts_catalog.png', url: 'http://localhost:3000/parts' },
  { name: '03_tmotor_product_page.png', url: 'http://localhost:3000/products/dev-tmotor-u5-kv400' },
  { name: '04_uav_builder_dashboard.png', url: 'http://localhost:3000/build' },
  { name: '05_cart_checkout_interface.png', url: 'http://localhost:3000/cart' },
  { name: '06_checkout_experience.png', url: 'http://localhost:3000/checkout' },
  { name: '07_bulk_uav_orders_dashboard.png', url: 'http://localhost:3000/bulk-orders/request' },
  { name: '08_my_orders_dashboard.png', url: 'http://localhost:3000/account/orders' },
  { name: '09_uav_support_center.png', url: 'http://localhost:3000/support' },
];

async function captureAll() {
  console.log('--- Capturing Proofs for All 9 Consumer Screens ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1312, height: 1100 } });
  const page = await context.newPage();

  for (const screen of SCREENS) {
    console.log(`Navigating to ${screen.url}...`);
    await page.goto(screen.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000); // Allow images to settle
    const filePath = path.join(OUTPUT_DIR, screen.name);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`Saved screenshot: ${screen.name}`);
  }

  await browser.close();
  console.log('\n--- All 9 Screens Successfully Captured! ---');
}

captureAll().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
