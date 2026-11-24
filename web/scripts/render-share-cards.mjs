// Renders share/imdusd.png and share/infer.png, the 1200 × 630 cards a link shows when it is posted. They carry no
// figure, so they never go stale. Run by hand after changing the words or the mark; the builds copy the files.
import { chromium } from "../node_modules/playwright/index.mjs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const here = import.meta.dirname;
const icon = readFileSync(resolve(here, "../public/icon.svg"), "utf8");
const CARDS = [
  ["imdusd", "imdUSD", "A dollar stablecoin borrowed against staked IMD, priced by panels of AI agents and checked on chain.", "imdusd.com"],
  ["infer", "INFER", "The imdUSD protocol’s token. Inference-Backed Endogenous Financial Reserve.", "infer.imdusd.com"],
];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [name, title, line, host] of CARDS) {
  await page.setContent(`<style>
    body { margin: 0; width: 1200px; height: 630px; box-sizing: border-box; padding: 72px 80px; background: #f7f5ef; color: #16202e; display: flex; flex-direction: column; font-family: "Iowan Old Style", Palatino, Georgia, serif; }
    svg { width: 132px; height: 132px; margin-left: -14px; }
    h1 { margin: auto 0 18px; font-size: 120px; line-height: 1; font-weight: 600; }
    p { margin: 0; font-size: 40px; line-height: 1.3; max-width: 980px; }
    .host { margin-top: 40px; font: 26px "SFMono-Regular", Consolas, monospace; color: #5a6472; }
  </style>${icon}<h1>${title}</h1><p>${line}</p><p class="host">${host}</p>`);
  await page.screenshot({ path: resolve(here, `../share/${name}.png`) });
}
await browser.close();
console.log("render-share-cards: wrote share/imdusd.png and share/infer.png");
