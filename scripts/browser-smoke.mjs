import assert from "node:assert/strict";
import { chromium } from "playwright";
import { PNG } from "pngjs";

const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--disable-web-security",
  ],
});

function colorVariety(buffer) {
  const image = PNG.sync.read(buffer);
  const colors = new Set();
  for (
    let y = Math.floor(image.height * 0.2);
    y < Math.floor(image.height * 0.8);
    y += 9
  ) {
    for (
      let x = Math.floor(image.width * 0.25);
      x < Math.floor(image.width * 0.8);
      x += 9
    ) {
      const i = (y * image.width + x) * 4;
      colors.add(
        `${image.data[i] >> 4}-${image.data[i + 1] >> 4}-${image.data[i + 2] >> 4}`,
      );
    }
  }
  return colors.size;
}

try {
  for (const config of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
    { name: "narrow", width: 320, height: 640 },
  ]) {
    const page = await browser.newPage({
      viewport: { width: config.width, height: config.height },
      deviceScaleFactor: 1,
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://127.0.0.1:3001/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1600);
    assert.equal(
      await page.locator("#webgl-fallback").isVisible(),
      false,
      `${config.name}: WebGL fallback shown`,
    );
    assert.deepEqual(errors, [], `${config.name}: JS exceptions`);
    assert.equal(await page.locator(".planet-label").count(), 15);
    const screenshot = await page.screenshot({
      path: `/tmp/planet-${config.name}.png`,
    });
    assert.ok(
      colorVariety(screenshot) > 35,
      `${config.name}: scene appears blank`,
    );
    assert.ok(
      colorVariety(await page.locator("#world").screenshot()) > 12,
      `${config.name}: canvas appears blank`,
    );
    const layout = await page.evaluate(() => ({
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      title: document.querySelector("h1").getBoundingClientRect().toJSON(),
    }));
    assert.ok(
      layout.pageWidth <= layout.viewportWidth + 2,
      `${config.name}: horizontal overflow`,
    );
    const headerLayout = await page.evaluate(() => ({
      brand: document.querySelector(".brand").getBoundingClientRect().right,
      actions: document.querySelector(".header-actions").getBoundingClientRect()
        .left,
    }));
    assert.ok(
      headerLayout.brand + 4 < headerLayout.actions,
      `${config.name}: header controls overlap`,
    );

    await page.locator("#directory-button").click();
    assert.equal(await page.locator(".directory-item").count(), 15);
    assert.equal(await page.locator('.directory-item:has-text("topics-after-party")').count(), 0);
    await page.locator(".directory-item").first().click();
    assert.equal(
      await page.locator("#detail-title").textContent(),
      "Super Agent Party",
    );
    assert.equal(
      await page.locator(":focus").getAttribute("id"),
      "detail-title",
    );
    assert.equal(
      await page
        .locator("#detail-metrics")
        .textContent()
        .then((value) => value.includes("AGPL-3.0")),
      true,
    );
    await page.waitForTimeout(900);
    await page.screenshot({ path: `/tmp/planet-${config.name}-detail.png` });
    await page.locator('[data-lang="en"]').click();
    assert.equal(
      await page.locator("#detail-source span").textContent(),
      "View source",
    );
    await page.locator("#close-detail").click();
    assert.equal(await page.locator("#detail-panel").isVisible(), false);
    assert.equal(
      await page.locator(":focus").getAttribute("id"),
      "directory-button",
    );
    await page.locator("#about-button").click();
    assert.equal(await page.locator("#about-dialog").isVisible(), true);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#about-dialog").isVisible(), false);
    await page.locator("#motion-button").click();
    assert.equal(
      await page.locator("#motion-button").getAttribute("aria-pressed"),
      "false",
    );
    await page.waitForTimeout(300);
    const before = await page.screenshot();
    await page.mouse.move(config.width * 0.56, config.height * 0.51);
    await page.mouse.down();
    await page.mouse.move(config.width * 0.7, config.height * 0.51, {
      steps: 8,
    });
    await page.mouse.up();
    await page.waitForTimeout(250);
    const after = await page.screenshot();
    assert.notDeepEqual(
      before,
      after,
      `${config.name}: dragging had no visible effect`,
    );
    console.log(
      `${config.name}: scene colors=${colorVariety(screenshot)}, directory=15, detail/language/about/drag passed`,
    );
    await page.close();
  }
  const landscapePage = await browser.newPage({
    viewport: { width: 667, height: 375 },
  });
  await landscapePage.goto("http://127.0.0.1:3001/", {
    waitUntil: "networkidle",
  });
  const landscape = await landscapePage.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    footerBottom: document
      .querySelector(".scene-footer")
      .getBoundingClientRect().bottom,
  }));
  assert.ok(
    landscape.scrollHeight > 375,
    "short landscape page cannot scroll to controls",
  );
  await landscapePage.locator("#directory-button").click();
  await landscapePage.locator(".directory-item").first().click();
  assert.equal(
    await landscapePage.locator(":focus").getAttribute("id"),
    "detail-title",
  );
  await landscapePage.close();
  const fallbackPage = await browser.newPage({
    viewport: { width: 1200, height: 800 },
  });
  await fallbackPage.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      if (
        kind === "webgl" ||
        kind === "webgl2" ||
        kind === "experimental-webgl"
      )
        return null;
      return original.call(this, kind, ...args);
    };
  });
  await fallbackPage.goto("http://127.0.0.1:3001/", {
    waitUntil: "networkidle",
  });
  assert.equal(await fallbackPage.locator("#webgl-fallback").isVisible(), true);
  await fallbackPage.locator("#fallback-directory").click();
  assert.equal(await fallbackPage.locator(".directory-item").count(), 15);
  console.log("WebGL fallback: directory remains usable");
  await fallbackPage.close();
  const reducedPage = await browser.newPage({ reducedMotion: "reduce" });
  await reducedPage.goto("http://127.0.0.1:3001/", {
    waitUntil: "networkidle",
  });
  assert.equal(
    await reducedPage.locator("#motion-button").getAttribute("aria-pressed"),
    "false",
  );
  console.log("Reduced motion: ambient motion defaults off");
  await reducedPage.close();
  const legacyPage = await browser.newPage();
  await legacyPage.goto("http://127.0.0.1:3001/projects/exameow/index.html", {
    waitUntil: "networkidle",
  });
  await legacyPage.waitForURL("**/#exameow");
  assert.equal(
    await legacyPage.locator("#detail-title").textContent(),
    "Exameow",
  );
  console.log("Legacy project URL: redirects to the matching planet");
  await legacyPage.close();
} finally {
  await browser.close();
}
