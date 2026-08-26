// End-to-end smoke: client login → dashboard → post task; provider login →
// browse → offer; client accepts (escrow) → provider delivers → client approves
// (release); admin verifies provider.
import { chromium } from "playwright-core";

const BASE = "http://localhost:3100";
const results = [];
const ok = (name, cond) => {
  results.push(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) process.exitCode = 1;
};

// Point CHROME_PATH at a local Chromium/Chrome binary.
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});

async function login(page, target) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="target"]', target);
  await page.click(String.raw`form:has(input[name="target"]) button`);
  await page.waitForURL("**/login/verify**");
  await page.fill('input[name="code"]', "123456");
  await page.click(String.raw`form:has(input[name="code"]) button`);
  await page.waitForLoadState("networkidle");
}

// --- Client: login, dashboard, post a task ---
const clientCtx = await browser.newContext();
const client = await clientCtx.newPage();
await login(client, "+97455551234");
ok("client lands on dashboard", client.url().includes("/dashboard"));
await client.goto(`${BASE}/tasks/new`);
await client.fill('input[name="title"]', "مهمة اختبار آلي");
await client.fill('textarea[name="description"]', "وصف تفصيلي للمهمة الاختبارية.");
await client.fill('input[name="budget"]', "800");
await client.fill('input[name="deadline"]', "2026-09-30");
await client.click(String.raw`form:has(input[name="title"]) button`);
await client.waitForURL(/\/tasks\/(?!new)[a-z0-9]+/);
const taskUrl = client.url();
ok("task created", /\/tasks\/(?!new)[a-z0-9]+/.test(taskUrl));

// --- Provider: login, browse, submit offer on the new task ---
const provCtx = await browser.newContext();
const prov = await provCtx.newPage();
await login(prov, "+97455550001");
ok("provider lands on provider dashboard", prov.url().includes("/provider"));
await prov.goto(`${BASE}/provider/browse`);
const card = prov.locator("text=مهمة اختبار آلي").locator("xpath=ancestor::div[contains(@class,'bg-white')]").first();
await card.locator("summary").click();
await card.locator('input[name="price"]').fill("750");
await card.locator('input[name="days"]').fill("4");
await card.locator('input[name="message"]').fill("جاهز أبدأ فوراً.");
await card.locator("button", { hasText: "تقديم عرض" }).click();
await prov.waitForURL("**sent=1**");
ok("offer submitted", true);

// --- Client: accept offer (escrow hold + contract) ---
await client.goto(taskUrl);
await client.click("button:has-text('اقبل العرض')");
await client.waitForLoadState("networkidle");
ok("task moved to in-progress", (await client.content()).includes("قيد التنفيذ"));
ok("contract generated", (await client.content()).includes("عرض العقد"));

// --- Chat both ways ---
await client.fill('input[name="body"]', "مرحبا، متى تبدأ؟");
await client.click("button:has-text('إرسال')");
await client.waitForLoadState("networkidle");

// --- Provider: deliver ---
const provTask = `${BASE}/provider/tasks/${taskUrl.split("/").pop()}`;
await prov.goto(provTask);
ok("provider sees chat message", (await prov.content()).includes("مرحبا، متى تبدأ؟"));
await prov.click("button:has-text('تسليم العمل')");
await prov.waitForLoadState("networkidle");

// --- Client: approve delivery → escrow released ---
await client.goto(taskUrl);
await client.click("button:has-text('اعتماد التسليم')");
await client.waitForLoadState("networkidle");
ok("task completed", (await client.content()).includes("مكتملة"));

// --- Provider earnings shows released balance (Arabic locale renders
// Eastern Arabic numerals, so accept either form of 660) ---
await prov.goto(`${BASE}/provider/earnings`);
const earnings = await prov.content();
ok(
  "provider has withdrawable balance (750-12% = 660)",
  earnings.includes("660") || earnings.includes("٦٦٠"),
);

// --- Wallet shows released payment ---
await client.goto(`${BASE}/wallet`);
ok("client wallet shows released", (await client.content()).includes("محرّر"));

// --- Admin: approve pending verification ---
const adminCtx = await browser.newContext();
const admin = await adminCtx.newPage();
await login(admin, "admin@overtime.qa");
ok("admin lands on admin panel", admin.url().includes("/admin"));
const before = await admin.content();
ok("admin sees pending verification", before.includes("خالد العبيدلي"));
await admin.click("button[value='approve']");
await admin.waitForLoadState("networkidle");

// --- Retainer subscribe ---
await client.goto(`${BASE}/retainers`);
await client.click("form button:has-text('اشترك')");
await client.waitForLoadState("networkidle");
ok("subscription active", (await client.content()).includes("اشتراكك الحالي"));

// --- English locale switch ---
await client.goto(`${BASE}/dashboard`);
await client.click("button:has-text('English')");
await client.waitForLoadState("networkidle");
ok("english + LTR", (await client.content()).includes('dir="ltr"'));

await browser.close();
console.log(results.join("\n"));
