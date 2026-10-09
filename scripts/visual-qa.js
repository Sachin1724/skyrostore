const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = path.join(__dirname, '../.screenshots');
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runVisualQA() {
  console.log('--- Starting Comprehensive Visual & Functional QA ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // 1. Homepage Verification
  console.log('\n1. Testing Homepage at http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  const title = await page.title();
  console.log('   Title:', title);

  const bulkOrdersLink = await page.locator('header a[href="/bulk-orders"]').count();
  console.log('   Header "Bulk Orders" link count:', bulkOrdersLink);
  if (bulkOrdersLink === 0) throw new Error('Missing Bulk Orders link in header');

  const mediaPendingCount = await page.locator('text=/MEDIA PENDING/i').count();
  console.log('   "MEDIA PENDING" occurrences on homepage:', mediaPendingCount);
  if (mediaPendingCount > 0) throw new Error('Found forbidden "MEDIA PENDING" label!');

  // Check technical highlight badges on cards
  const techBadges = await page.locator('.font-mono.text-\\[10px\\]').allInnerTexts();
  console.log('   Sample technical badges on product cards:', techBadges.slice(0, 6));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_homepage_desktop.png'), fullPage: false });
  console.log('   Saved: 01_homepage_desktop.png');

  // Mobile viewport check
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_homepage_mobile.png'), fullPage: false });
  console.log('   Saved: 02_homepage_mobile.png');

  // Reset to Desktop
  await page.setViewportSize({ width: 1280, height: 900 });

  // 2. Product Detail Page Verification (Motor with detailed specs)
  console.log('\n2. Testing Product Detail Page at /products/dev-tmotor-u5-kv400...');
  await page.goto('http://localhost:3000/products/dev-tmotor-u5-kv400', { waitUntil: 'networkidle' });

  const pdpMediaPending = await page.locator('text=/MEDIA PENDING/i').count();
  if (pdpMediaPending > 0) throw new Error('Found MEDIA PENDING on PDP');

  const bulkQuoteBtn = await page.locator('a[href*="/bulk-orders/request"]').count();
  console.log('   "Request Bulk Quote" button count on PDP:', bulkQuoteBtn);
  if (bulkQuoteBtn === 0) throw new Error('Missing Request Bulk Quote button on PDP');

  const specSection = await page.locator('#specifications').count();
  console.log('   Engineering Specifications section present:', specSection > 0);

  const compatSection = await page.locator('#compatibility').count();
  console.log('   UAV Compatibility section present:', compatSection > 0);

  const docSection = await page.locator('#documentation').count();
  console.log('   Documentation & Compliance section present:', docSection > 0);

  const pkgSection = await page.locator('#whats-included').count();
  console.log('   Package Contents section present:', pkgSection > 0);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_pdp_desktop.png'), fullPage: false });
  console.log('   Saved: 03_pdp_desktop.png');

  // Mobile PDP
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_pdp_mobile.png'), fullPage: false });
  console.log('   Saved: 04_pdp_mobile.png');
  await page.setViewportSize({ width: 1280, height: 900 });

  // 3. Bulk Orders Landing Page
  console.log('\n3. Testing Bulk Orders Landing Page at /bulk-orders...');
  await page.goto('http://localhost:3000/bulk-orders', { waitUntil: 'networkidle' });
  const bulkHeading = await page.locator('h1').innerText();
  console.log('   Bulk Landing H1:', bulkHeading);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_bulk_landing.png'), fullPage: false });
  console.log('   Saved: 05_bulk_landing.png');

  // 4. Bulk Orders Request Form & Submission
  console.log('\n4. Testing Request Form Submission at /bulk-orders/request...');
  await page.goto('http://localhost:3000/bulk-orders/request', { waitUntil: 'networkidle' });

  // Select Bulk Custom Builds
  await page.click('button:has-text("Bulk Custom Builds")');

  // Fill in Form
  await page.fill('input[placeholder*="Dr. Rajesh"]', 'Air Commodore Rajiv Verma');
  await page.fill('input[placeholder*="rajesh@"]', 'verma@drdo-aeronautics.gov.in');
  await page.fill('input[placeholder*="+91"]', '+91 94480 12345');
  await page.fill('input[placeholder*="AeroTech Precision"]', 'Defense Aviation Lab');
  await page.fill('input[placeholder*="27AABCA"]', '07AAACD1234F1Z1');
  await page.fill('input[placeholder="City"]', 'New Delhi');
  await page.fill('input[placeholder="State"]', 'Delhi');

  await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_request_form_filled.png'), fullPage: false });
  console.log('   Saved: 06_request_form_filled.png');

  // Submit form
  console.log('   Submitting request form...');
  await page.click('button[type="submit"]:has-text("Submit Formal Request")');

  await page.waitForSelector('text="Request Submitted Successfully"', { timeout: 10000 });
  const refNo = await page.locator('.font-mono.text-\\[18px\\]').innerText();
  console.log('   SUCCESS! Generated Reference Number:', refNo);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_request_success.png'), fullPage: false });
  console.log('   Saved: 07_request_success.png');

  // 5. Admin Authentication
  console.log('\n5. Authenticating Admin for Management Portal...');
  const adminAuthRes = await fetch('http://localhost:9000/auth/user/emailpass', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@skyrostore.com', password: 'admin123' }),
  });
  const adminAuthData = await adminAuthRes.json();
  const adminToken = adminAuthData.token;

  await context.addCookies([
    {
      name: 'admin_token',
      value: adminToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  console.log('   Admin authentication token attached to session.');

  // 6. Admin Products & Specifications Editor
  console.log('\n6. Testing Admin Technical Specifications Editor at http://localhost:3001/products...');
  await page.goto('http://localhost:3001/products', { waitUntil: 'networkidle' });

  const editSpecsLinks = await page.locator('a:has-text("Edit Specs")').all();
  console.log('   "Edit Specs" buttons found in table:', editSpecsLinks.length);
  if (editSpecsLinks.length === 0) throw new Error('No Edit Specs buttons found on admin products page');

  await editSpecsLinks[0].click();
  await page.waitForSelector('text="Technical Specifications"', { timeout: 10000 });

  const canonicalBadges = await page.locator('span:has-text("Canonical")').count();
  console.log('   [Canonical] engine badges visible in editor:', canonicalBadges);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_admin_specs_editor.png'), fullPage: false });
  console.log('   Saved: 08_admin_specs_editor.png');

  // 7. Admin Bulk Orders & Quotation Workbench
  console.log('\n7. Testing Admin Bulk Orders Dashboard at http://localhost:3001/bulk-orders...');
  await page.goto('http://localhost:3001/bulk-orders', { waitUntil: 'networkidle' });

  const latestRequestRow = page.locator(`tr:has-text("${refNo}")`);
  const rowCount = await latestRequestRow.count();
  console.log(`   Found newly submitted request ${refNo} in admin list:`, rowCount > 0);

  // Click manage on first request
  const manageButtons = await page.locator('a:has-text("Manage")').all();
  console.log('   "Manage" request buttons found:', manageButtons.length);
  await manageButtons[0].click();

  await page.waitForSelector('text="Quotation Pricing & Revision Workbench"', { timeout: 10000 });
  console.log('   Admin Quotation Workbench loaded successfully!');

  await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_admin_quotation_workbench.png'), fullPage: false });
  console.log('   Saved: 09_admin_quotation_workbench.png');

  await browser.close();
  console.log('\n======================================================');
  console.log('  ALL VISUAL QA CHECKS PASSED WITH 0 ERRORS!         ');
  console.log('======================================================');
}

runVisualQA().catch((err) => {
  console.error('\nQA FAILED with error:', err);
  process.exit(1);
});
