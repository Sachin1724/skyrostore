const { chromium } = require("@playwright/test");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.resolve(__dirname, "../demo_video");
const FINAL_MP4 = path.resolve(__dirname, "../skyrostore-tutorial-walkthrough.mp4");

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Injects the sleek bottom HUD tutorial caption bar
async function updateHUD(page, { step, pageTitle, subtitle, tag }) {
  await page.evaluate(
    ({ step, pageTitle, subtitle, tag }) => {
      let hud = document.getElementById("skyro-video-hud");
      if (!hud) {
        hud = document.createElement("div");
        hud.id = "skyro-video-hud";
        hud.style.cssText = `
          position: fixed !important;
          bottom: 24px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: calc(100% - 100px) !important;
          max-width: 1360px !important;
          background: linear-gradient(135deg, rgba(10, 26, 47, 0.94), rgba(15, 36, 64, 0.94)) !important;
          border: 1.5px solid rgba(56, 189, 248, 0.45) !important;
          border-radius: 20px !important;
          padding: 18px 32px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 24px !important;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.75), 0 0 40px rgba(14, 165, 233, 0.25) !important;
          z-index: 2147483647 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          color: #fff !important;
          pointer-events: none !important;
          backdrop-filter: blur(20px) !important;
          transition: all 0.35s ease !important;
        `;
        document.body.appendChild(hud);
      }
      hud.innerHTML = `
        <div style="display: flex; align-items: center; gap: 20px;">
          <div style="background: linear-gradient(135deg, #0066FF, #0284C7); color: #fff; font-weight: 800; font-size: 13px; padding: 7px 16px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.08em; box-shadow: 0 0 20px rgba(0,102,255,0.6); white-space: nowrap;">
            ${step}
          </div>
          <div>
            <div style="font-size: 21px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.01em; line-height: 1.2;">
              ${pageTitle}
            </div>
            <div style="font-size: 14px; color: #94A3B8; font-weight: 500; margin-top: 4px; line-height: 1.3;">
              ${subtitle}
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; background: rgba(255, 255, 255, 0.07); padding: 9px 20px; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.15); white-space: nowrap;">
          <span style="width: 10px; height: 10px; border-radius: 50%; background: #22C55E; box-shadow: 0 0 14px #22C55E; display: inline-block;"></span>
          <span style="font-size: 13px; font-weight: 700; color: #38BDF8; letter-spacing: 0.04em;">${tag}</span>
        </div>
      `;
    },
    { step, pageTitle, subtitle, tag }
  );
}

// Injects an animated glowing virtual cursor
async function injectCursor(page) {
  await page.evaluate(() => {
    let cursor = document.getElementById("skyro-virtual-cursor");
    if (!cursor) {
      cursor = document.createElement("div");
      cursor.id = "skyro-virtual-cursor";
      cursor.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 24px !important;
        height: 24px !important;
        border-radius: 50% !important;
        background: rgba(0, 102, 255, 0.45) !important;
        border: 2px solid #00D2FF !important;
        box-shadow: 0 0 20px rgba(0, 210, 255, 0.9) !important;
        pointer-events: none !important;
        z-index: 2147483647 !important;
        transform: translate(-50%, -50%) !important;
        transition: width 0.15s, height 0.15s, background 0.15s, border-color 0.15s, transform 0.05s ease-out !important;
      `;
      document.body.appendChild(cursor);

      window.addEventListener("mousemove", (e) => {
        cursor.style.left = e.clientX + "px";
        cursor.style.top = e.clientY + "px";
      });
      window.addEventListener("mousedown", () => {
        cursor.style.width = "18px";
        cursor.style.height = "18px";
        cursor.style.background = "rgba(239, 68, 68, 0.85)";
        cursor.style.borderColor = "#FF453A";
        cursor.style.boxShadow = "0 0 25px rgba(255, 69, 58, 1)";
      });
      window.addEventListener("mouseup", () => {
        cursor.style.width = "24px";
        cursor.style.height = "24px";
        cursor.style.background = "rgba(0, 102, 255, 0.45)";
        cursor.style.borderColor = "#00D2FF";
        cursor.style.boxShadow = "0 0 20px rgba(0, 210, 255, 0.9)";
      });
    }
  });
}

// Smoothly moves mouse from current position to a target element or coordinate
async function smoothMouseMove(page, targetX, targetY, steps = 25) {
  const currentPos = await page.evaluate(() => {
    const c = document.getElementById("skyro-virtual-cursor");
    return c
      ? { x: parseFloat(c.style.left) || 960, y: parseFloat(c.style.top) || 540 }
      : { x: 960, y: 540 };
  });

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    // Ease out cubic
    const ease = 1 - Math.pow(1 - t, 3);
    const x = currentPos.x + (targetX - currentPos.x) * ease;
    const y = currentPos.y + (targetY - currentPos.y) * ease;
    await page.mouse.move(x, y);
    await wait(14);
  }
}

// Move to selector and click
async function moveAndClick(page, selector, clickWait = 400) {
  try {
    const el = await page.waitForSelector(selector, { timeout: 4000 });
    const box = await el.boundingBox();
    if (box) {
      const targetX = box.x + box.width / 2;
      const targetY = box.y + box.height / 2;
      await smoothMouseMove(page, targetX, targetY);
      await wait(150);
      await page.mouse.down();
      await wait(100);
      await page.mouse.up();
      await wait(clickWait);
    }
  } catch (err) {
    console.warn("Could not click selector:", selector, err.message);
  }
}

// Smooth scroll by pixel delta
async function smoothScroll(page, deltaY, durationMs = 1200) {
  const frames = Math.max(15, Math.floor(durationMs / 20));
  const step = deltaY / frames;
  for (let i = 0; i < frames; i++) {
    await page.evaluate((s) => window.scrollBy({ top: s, behavior: "instant" }), step);
    await wait(20);
  }
}

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Clean old webm files
  for (const f of fs.readdirSync(OUTPUT_DIR)) {
    if (f.endsWith(".webm")) fs.unlinkSync(path.join(OUTPUT_DIR, f));
  }

  console.log("Launching Chromium for 1080p video recording...");
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  // Helper to re-inject cursor and HUD after any navigation
  async function refreshOverlays(hudInfo) {
    await injectCursor(page);
    await updateHUD(page, hudInfo);
  }

  try {
    // =========================================================================
    // SCENE 1: HOMEPAGE & REAL-TIME SEARCH
    // =========================================================================
    console.log("Recording Scene 1: Homepage & Search...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
    await refreshOverlays({
      step: "Step 1 of 8",
      pageTitle: "Skyrostore Homepage & Product Catalog",
      subtitle: "India's premier UAV engineering store · Verified stock · Direct Odisha workshop dispatch",
      tag: "FULL STACK STOREFRONT",
    });
    await smoothMouseMove(page, 960, 540);
    await wait(1200);

    // Smooth scroll down to view Trust Grid & Featured Components
    await smoothScroll(page, 550, 1500);
    await wait(1000);
    await smoothScroll(page, 650, 1600);
    await wait(1200);

    // Scroll back to header search bar
    await smoothScroll(page, -1200, 1500);
    await wait(600);

    // Move to Search input and type "Pixhawk"
    await refreshOverlays({
      step: "Step 1 of 8",
      pageTitle: "Instant Search Autocomplete",
      subtitle: "Live debounced search fetching real-time UAV categories, brands & stock from backend",
      tag: "LIVE SEARCH API",
    });

    const searchInput = 'input[type="search"], input[placeholder*="Search"]';
    await moveAndClick(page, searchInput);
    await page.type(searchInput, "Pixhawk", { delay: 120 });
    await wait(1500); // Showcase autocomplete dropdown

    // Click on the autocomplete suggestion
    const suggestion = 'div[role="option"], li[role="option"], a[href*="dev-pixhawk-6c-mini"]';
    if (await page.$(suggestion)) {
      await moveAndClick(page, suggestion);
    } else {
      await page.goto("http://localhost:3000/products/dev-pixhawk-6c-mini", { waitUntil: "networkidle" });
    }

    // =========================================================================
    // SCENE 2: PRODUCT DETAIL PAGE & PINCODE SERVICEABILITY
    // =========================================================================
    console.log("Recording Scene 2: Product Details & Pincode Check...");
    await page.waitForLoadState("networkidle");
    await refreshOverlays({
      step: "Step 2 of 8",
      pageTitle: "Product Engineering Specs & Pin Delivery",
      subtitle: "Verified UAV technical specs · Telemetry pinouts · Real-time courier check to Odisha",
      tag: "ENGINEERING DATA",
    });
    await wait(1200);

    // Scroll down to view technical specs & pinout details
    await smoothScroll(page, 450, 1400);
    await wait(1200);

    // Pincode delivery check
    await refreshOverlays({
      step: "Step 2 of 8",
      pageTitle: "Shipmozo Delivery Checker",
      subtitle: "Checking pincode 755001 against Odisha warehouse pickup location via API",
      tag: "PINCODE CHECKER",
    });

    const pinInput = 'input[placeholder*="PIN"], input[placeholder*="pincode"], input[placeholder*="Pin"]';
    if (await page.$(pinInput)) {
      await moveAndClick(page, pinInput);
      await page.fill(pinInput, "755001");
      await wait(400);
      const checkBtn = 'button:has-text("Check"), button:has-text("Verify")';
      if (await page.$(checkBtn)) {
        await moveAndClick(page, checkBtn);
        await wait(1200);
      }
    }

    // Adjust quantity stepper
    const plusBtn = 'button[aria-label*="Increase"], button:has-text("+")';
    if (await page.$(plusBtn)) {
      await moveAndClick(page, plusBtn);
      await wait(500);
    }

    // Click "Add to Cart"
    await refreshOverlays({
      step: "Step 2 of 8",
      pageTitle: "Add to Cart Action",
      subtitle: "Stock reservation lock · Cart synchronization across browser session",
      tag: "CART CONVERSION",
    });

    const addToCartBtn = 'button:has-text("Add to cart"), button:has-text("Add to Cart")';
    await moveAndClick(page, addToCartBtn, 800);
    await wait(1500);

    // =========================================================================
    // SCENE 3: CART DRAWER & RAZORPAY CHECKOUT PREVIEW
    // =========================================================================
    console.log("Recording Scene 3: Cart Drawer...");
    await refreshOverlays({
      step: "Step 3 of 8",
      pageTitle: "Instant Slide-over Cart Drawer",
      subtitle: "Dynamic itemized subtotal, free shipping tier calculation & 1-click Razorpay checkout",
      tag: "RAZORPAY READY",
    });
    await wait(2200);

    // Close cart drawer
    const closeCartBtn = 'button[aria-label*="Close cart"], button[aria-label*="Close"]';
    if (await page.$(closeCartBtn)) {
      await moveAndClick(page, closeCartBtn);
    } else {
      await page.keyboard.press("Escape");
    }
    await wait(800);

    // =========================================================================
    // SCENE 4: DRONE CONFIGURATOR / BUILDER (/build)
    // =========================================================================
    console.log("Recording Scene 4: Drone Configurator...");
    await page.goto("http://localhost:3000/build", { waitUntil: "networkidle" });
    await refreshOverlays({
      step: "Step 4 of 8",
      pageTitle: "Build Your Drone — Smart UAV Configurator",
      subtitle: "Automated compatibility engine matching Frame, Motors, ESC, Flight Controller & Battery",
      tag: "DRONE BUILDER",
    });
    await wait(1400);

    // Select Frame (Step 1)
    await refreshOverlays({
      step: "Step 4 of 8",
      pageTitle: "Step 1: Selecting Airframe",
      subtitle: "Choosing X450 Carbon Frame Kit (Quad-rotor platform)",
      tag: "CONFIGURATOR",
    });
    const frameTile = 'button:has-text("X450"), div:has-text("X450 Carbon Frame")';
    if (await page.$(frameTile)) {
      await moveAndClick(page, frameTile);
      await wait(1200);
    }

    // Select Motors (Step 2)
    await refreshOverlays({
      step: "Step 4 of 8",
      pageTitle: "Step 2: Selecting Propulsion Motors",
      subtitle: "Choosing T-Motor U5 KV400 — matched for 15-inch carbon blades",
      tag: "COMPATIBILITY CHECK",
    });
    const motorTile = 'button:has-text("T-Motor"), div:has-text("T-Motor U5")';
    if (await page.$(motorTile)) {
      await moveAndClick(page, motorTile);
      await wait(1200);
    }

    // Select ESC (Step 3)
    await refreshOverlays({
      step: "Step 4 of 8",
      pageTitle: "Step 3: Speed Controllers (ESC)",
      subtitle: "Choosing BLHeli32 4-in-1 ESC 50A with DShot1200 telemetry",
      tag: "AVIONICS MATCHING",
    });
    const escTile = 'button:has-text("BLHeli32"), div:has-text("BLHeli32")';
    if (await page.$(escTile)) {
      await moveAndClick(page, escTile);
      await wait(1200);
    }

    // Scroll to show BOM summary and weight calculation
    await smoothScroll(page, 400, 1000);
    await wait(1500);

    // =========================================================================
    // SCENE 5: COMPLETE UAVS CATALOG (/uavs)
    // =========================================================================
    console.log("Recording Scene 5: Complete UAVs...");
    await page.goto("http://localhost:3000/uavs", { waitUntil: "networkidle" });
    await refreshOverlays({
      step: "Step 5 of 8",
      pageTitle: "Complete Ready-To-Fly UAV Systems",
      subtitle: "Turnkey enterprise platforms for aerial mapping, surveying & agricultural inspection",
      tag: "ENTERPRISE UAVs",
    });
    await wait(1400);

    await smoothScroll(page, 500, 1400);
    await wait(1200);
    await smoothScroll(page, -500, 1000);
    await wait(800);

    // =========================================================================
    // SCENE 6: PARTS CATALOG & FILTERS (/parts)
    // =========================================================================
    console.log("Recording Scene 6: Parts Catalog...");
    await page.goto("http://localhost:3000/parts", { waitUntil: "networkidle" });
    await refreshOverlays({
      step: "Step 6 of 8",
      pageTitle: "Parts Catalog & Technical Filters",
      subtitle: "Filter components by Motors, Flight Controllers, ESCs, GPS & Propellers",
      tag: "PARAMETRIC SEARCH",
    });
    await wait(1400);

    // Click category filter or Compare checkbox
    const filterMotor = 'a:has-text("Motors"), button:has-text("Motors")';
    if (await page.$(filterMotor)) {
      await moveAndClick(page, filterMotor);
      await wait(1200);
    }

    // Check compare checkbox
    const compareCheckbox = 'input[type="checkbox"]';
    if (await page.$(compareCheckbox)) {
      await moveAndClick(page, compareCheckbox);
      await wait(1000);
    }

    await smoothScroll(page, 450, 1200);
    await wait(1200);

    // =========================================================================
    // SCENE 7: BRANDS DIRECTORY & B2B BULK ORDERS (/brands & /bulk-orders)
    // =========================================================================
    console.log("Recording Scene 7: Brands & B2B Orders...");
    await page.goto("http://localhost:3000/brands", { waitUntil: "networkidle" });
    await refreshOverlays({
      step: "Step 7 of 8",
      pageTitle: "Authorized Brand Partners",
      subtitle: "Official distributor network: T-Motor, RadioMaster, BetaFPV, Foxeer, Holybro",
      tag: "GENUINE HARDWARE",
    });
    await wait(1800);

    await page.goto("http://localhost:3000/bulk-orders", { waitUntil: "networkidle" });
    await refreshOverlays({
      step: "Step 7 of 8",
      pageTitle: "B2B & Institutional Supply Portal",
      subtitle: "18% GST Input Tax Credit · Formal government/university quotations · Fleet discounts",
      tag: "B2B READY",
    });
    await wait(1200);
    await smoothScroll(page, 550, 1400);
    await wait(1500);

    // =========================================================================
    // SCENE 8: MERCHANT ADMIN DASHBOARD (http://localhost:3001)
    // =========================================================================
    console.log("Recording Scene 8: Admin Dashboard...");
    await page.goto("http://localhost:3001/login", { waitUntil: "networkidle" });
    await refreshOverlays({
      step: "Step 8 of 8",
      pageTitle: "Merchant Admin & Fulfillment Operations",
      subtitle: "Secure administrative console for stock management, live orders & courier booking",
      tag: "ADMIN DASHBOARD",
    });
    await wait(1200);

    // Auto-login to Admin
    const emailInput = 'input[type="email"], input[name="email"]';
    const pwdInput = 'input[type="password"], input[name="password"]';
    if (await page.$(emailInput)) {
      await moveAndClick(page, emailInput);
      await page.fill(emailInput, "admin@skyrostore.com");
      await wait(300);
      await moveAndClick(page, pwdInput);
      await page.fill(pwdInput, "admin123");
      await wait(300);
      const submitBtn = 'button[type="submit"]';
      await moveAndClick(page, submitBtn);
      await page.waitForLoadState("networkidle");
      await wait(1500);
    }

    // Now inside admin dashboard
    await refreshOverlays({
      step: "Step 8 of 8",
      pageTitle: "Real-time Order & Inventory Control",
      subtitle: "Connected directly to Supabase PostgreSQL Mumbai database with automated tracking",
      tag: "ENTERPRISE BACKEND",
    });
    await wait(1500);
    await smoothScroll(page, 450, 1400);
    await wait(1500);

    // Final Outro Screen
    await refreshOverlays({
      step: "COMPLETED",
      pageTitle: "Skyrostore — Built for India's UAV Industry",
      subtitle: "Full-Stack E-Commerce Engine: Next.js 15 · MedusaJS 2 · Supabase · Razorpay · Shipmozo",
      tag: "READY FOR LAUNCH 🚀",
    });
    await wait(3000);

    console.log("Recording completed successfully!");
  } catch (err) {
    console.error("Error during recording:", err);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  // Find recorded WebM file
  const webmFiles = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".webm"));
  if (webmFiles.length === 0) {
    throw new Error("No webm video found in output directory!");
  }

  const rawVideo = path.join(OUTPUT_DIR, webmFiles[0]);
  console.log(`Encoding ${rawVideo} to high-definition MP4: ${FINAL_MP4}...`);

  // Convert WebM to MP4 using ffmpeg
  const ffmpegCmd = `ffmpeg -y -i "${rawVideo}" -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p "${FINAL_MP4}"`;
  execSync(ffmpegCmd, { stdio: "inherit" });

  const stats = fs.statSync(FINAL_MP4);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`\n🎉 SUCCESS! Walkthrough video created at: ${FINAL_MP4} (${sizeMB} MB)`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

