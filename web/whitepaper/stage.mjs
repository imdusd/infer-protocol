// Stages the INFER whitepaper for whitepaper.imdusd.com: the paper's own single file, unchanged, from
// its repository (imdusd/infer-whitepaper, checked out at ../../imd/whitepaper/web by default, or
// WHITEPAPER_SRC), plus the headers Cloudflare serves with it. Nothing else from that repository is
// uploaded: not its README, not its .git.
//
// No Content-Security-Policy, on purpose: the paper loads Google Fonts, reads DexScreener and
// api.imd.fun for live figures and frames giscus for comments, and a policy would have to be kept in
// step with a file this repository does not own. The paper renders with all of them blocked.
import {
  mkdirSync,
  copyFileSync,
  writeFileSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(
  process.env.WHITEPAPER_SRC ?? resolve(here, "../../../imd/whitepaper/web"),
  "index.html",
);
const out = resolve(here, "../../dist-whitepaper");
const html = readFileSync(src, "utf8");
if (statSync(src).size < 50_000 || !html.includes("<title>"))
  throw Error(`${src} does not look like the paper`);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
copyFileSync(src, resolve(out, "index.html"));
writeFileSync(
  resolve(out, "_headers"),
  `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
/
  Link: <https://whitepaper.imdusd.com/>; rel="canonical"
`,
);
// The canonical URL goes in a header, not the page, so the file stays byte-for-byte the IPFS copy.
writeFileSync(resolve(out, "robots.txt"), "User-agent: *\nAllow: /\nSitemap: https://whitepaper.imdusd.com/sitemap.xml\n");
writeFileSync(
  resolve(out, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://whitepaper.imdusd.com/</loc></url>\n</urlset>\n`,
);
console.log(
  `whitepaper staged: ${html.length} bytes, sha256 ${createHash("sha256").update(html).digest("hex")}`,
);
