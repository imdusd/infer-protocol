// Structured data (schema.org JSON-LD) for every site, and the static summary the homepage carries
// for readers that do not run JavaScript (search and answer-engine crawlers). One entity graph,
// so imdUSD, INFER and the docs resolve to the same names and addresses everywhere they appear.
//
// JSON-LD is a data block, not a script: the CSP does not apply to it and the one-inline-script
// check in vite.config.ts does not count it (it matches bare <script> only).

import { execFileSync } from "node:child_process";
import { dirname } from "node:path";

export const SITE = "https://imdusd.com";
export const INFER_SITE = "https://infer.imdusd.com";
export const LAUNCHED = "2026-10-11";
export const IMDUSD = "0x61aAF8a992A3143e2B0C9cB0030b9fE702854a25";
export const VAULT = "0x0b69F8DA8D8cE521d74Ea69a7A3475B77302EF82";

const ORG_ID = `${SITE}/#organization`;
const IMDUSD_ID = `${SITE}/#imdusd`;
const INFER_ID = `${INFER_SITE}/#infer`;

const organization = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "imdUSD",
  url: `${SITE}/`,
  logo: `${SITE}/icon-512.png`,
  sameAs: ["https://x.com/imdusd", "https://github.com/imdusd", "https://defillama.com/protocol/infer"],
};

const imdusd = {
  "@type": "FinancialProduct",
  "@id": IMDUSD_ID,
  name: "imdUSD",
  alternateName: "imdUSD stablecoin",
  description:
    "imdUSD is a stablecoin meant to be worth one US dollar, borrowed against sIMD (staked IMD) on Ethereum. Its collateral is priced by panels of IdentityMD agents answering a fixed question, signed and checked on chain. Any holder can redeem it for $1 of sIMD less a fee.",
  url: `${SITE}/`,
  provider: { "@id": ORG_ID },
  category: "Stablecoin",
  identifier: `eip155:1/erc20:${IMDUSD}`,
  releaseDate: LAUNCHED,
};

const infer = {
  "@type": "FinancialProduct",
  "@id": INFER_ID,
  name: "INFER",
  alternateName: "Inference-Backed Endogenous Financial Reserve",
  description:
    "INFER (Inference-Backed Endogenous Financial Reserve) is the token of the imdUSD protocol on Ethereum: fixed supply, no owner, no further minting and no tax. It stakes as sINFER for a share of what the protocol earns.",
  url: `${INFER_SITE}/`,
  provider: { "@id": ORG_ID },
  category: "Cryptocurrency token",
  sameAs: ["https://www.coingecko.com/en/coins/inference-backed-endogenous-financial-reserve"],
};

const graph = (...nodes) => ({ "@context": "https://schema.org", "@graph": nodes });

/** A JSON-LD block. `<` is escaped so no string in the data can close the element. */
export const jsonLd = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

export const homeLd = () =>
  jsonLd(
    graph(organization, imdusd, infer, {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      name: "imdUSD",
      url: `${SITE}/`,
      publisher: { "@id": ORG_ID },
    }),
  );

export const inferLd = () => jsonLd(graph(organization, infer));

/** A docs page: a TechArticle about imdUSD, inside the docs' breadcrumb trail. */
export const docsLd = ({ url, title, description, section }) =>
  jsonLd(
    graph({
      "@type": "TechArticle",
      headline: title,
      description,
      url,
      inLanguage: "en",
      about: { "@id": IMDUSD_ID },
      publisher: organization,
      isPartOf: { "@type": "WebSite", name: "imdUSD docs", url: `${SITE}/docs/` },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Docs", item: `${SITE}/docs/` },
          { "@type": "ListItem", position: 2, name: section },
          { "@type": "ListItem", position: 3, name: title, item: url },
        ],
      },
    }),
  );

/** A blog post. `date` and `updated` are YYYY-MM-DD or empty. */
export const postLd = ({ url, title, description, date, updated }) =>
  jsonLd(
    graph({
      "@type": "BlogPosting",
      headline: title,
      description,
      url,
      inLanguage: "en",
      ...(date ? { datePublished: date } : {}),
      ...(updated ? { dateModified: updated } : {}),
      about: { "@id": IMDUSD_ID },
      author: organization,
      publisher: organization,
    }),
  );

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const link = (href, text) => `<li><a href="${esc(href)}">${esc(text)}</a></li>`;
const summary = (h1, paragraphs, links, extra = "") =>
  `<main class="prerender"><h1>${esc(h1)}</h1>${paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}${extra}` +
  `<ul>${links.map(([href, text]) => link(href, text)).join("")}</ul></main>`;

/**
 * A page's static summary, inside #root: what a crawler that does not run JavaScript reads. React
 * replaces it when the page's code mounts, so a visitor sees it only while that code loads. No live
 * figure belongs here: it would be wrong by the time it was read.
 */
export const withSummary = (html, body) => {
  if (html.split('<div id="root"></div>').length !== 2) throw Error("expected one empty #root to hold the summary");
  return html.replace('<div id="root"></div>', () => `<div id="root">${body}</div>`);
};

/** Only the page's heading, unseen, for a page whose own one is drawn by React: it adds nothing to the first paint. */
export const headingOnly = (h1) => `<h1 class="sr-only">${esc(h1)}</h1>`;

export const homeSummary = () =>
  summary(
    "imdUSD",
    [imdusd.description, `Live on Ethereum mainnet since 11 October 2026. imdUSD: ${IMDUSD}. Vault: ${VAULT}.`],
    [
      ["/docs/overview/what-is-imdusd/", "What is imdUSD"],
      ["/docs/overview/how-it-holds-a-dollar/", "How imdUSD holds a dollar"],
      ["/docs/reference/oracle-and-question-binding/", "How the agent panels price the collateral"],
      ["/docs/overview/faq/", "Questions and answers"],
      ["/docs/economics/risks-and-open-questions/", "Risks and open questions"],
      ["/docs/reference/contracts-and-addresses/", "Contracts and addresses"],
      ["/stats/", "Live figures"],
      [`${INFER_SITE}/`, "INFER, the protocol's token"],
    ],
  );

export const statsSummary = () =>
  summary(
    "imdUSD Analytics",
    [
      "Live on-chain figures for imdUSD, the dollar stablecoin borrowed against staked IMD: its price against $1, what redeeming returns, every swarm price update, the loan book, a stress test, holders, events and the Treasury.",
      "The figures are read from Ethereum when the page opens. The same event logs are served as JSON by the public history index.",
    ],
    [
      ["/api/v1/meta", "Public history index"],
      ["/docs/economics/swarm-evidence/", "What the swarm's price updates prove"],
      ["/docs/economics/risks-and-open-questions/", "Risks and open questions"],
      ["/docs/reference/reading-state/", "Reading state from the contracts"],
    ],
  );

export const buildSummary = () =>
  summary(
    "Build with the swarm",
    [
      "Order work from the IdentityMD agent swarm and pay in imdUSD from any wallet: describe it, get INFER BOX's check for free, and the swarm builds it. Questions come back as signed answers; builds land in a public repository.",
      "Also here: swarm oracle answers any contract can verify, the public history API, the open-source keeper, the peg pool and every contract address.",
    ],
    [
      ["/docs/reference/oracle-and-question-binding/", "Swarm oracle answers"],
      ["/api/v1/meta", "Public history API"],
      ["https://github.com/imdusd/imdusd-keeper", "The open-source keeper"],
      ["/docs/overview/the-peg-pool/", "The peg pool"],
      ["/docs/reference/contracts-and-addresses/", "Contracts and addresses"],
    ],
  );

const INFER_LINKS = {
  "": ["/", "Trade and stake INFER"],
  "buy/": ["/buy/", "Buy INFER"],
  "claim/": ["/claim/", "Claim INFER"],
  "tokenomics/": ["/tokenomics/", "INFER tokenomics"],
};

/** An INFER page's summary, from the launch file; nothing before launch, when the figures are not set. */
export const inferSummary = (page, L) => {
  const c = L.contracts;
  if (!INFER_LINKS[page] || c.infer === null) return "";
  const what = `INFER (Inference-Backed Endogenous Financial Reserve) is the token of the imdUSD protocol on Ethereum: ${Number(L.supply).toLocaleString("en-US")} fixed supply, no owner, no further minting and no tax. INFER: ${c.infer}.`;
  const body = {
    "": [what, `It trades against ${L.pair} in a Uniswap v4 launch pool whose liquidity is held for good. Stake it as sINFER (${c.stakedInfer}) to receive INFER the Treasury buys with protocol revenue. Revenue is not guaranteed.`],
    "buy/": [what, `INFER trades against ${L.pair} in its Uniswap v4 launch pool. Check the token address before you buy.`],
    "claim/": [
      `Claim INFER two ways: season points for using imdUSD, paid from the SeasonVault (${c.seasonVault}), and ${L.redemptions.map((r) => r.symbol).join(" or ")} redeemed at fixed rates for one year from launch through the LegacyRedeemer (${c.legacyRedeemer}).`,
      what,
    ],
    "tokenomics/": [what],
  }[page];
  const table =
    page === "tokenomics/"
      ? `<ul>${L.allocation.map((a) => `<li>${esc(`${a.label}: ${a.bps / 100}%. ${a.note}`)}</li>`).join("")}</ul>`
      : "";
  return summary(
    INFER_LINKS[page][1],
    body,
    [
      ...Object.entries(INFER_LINKS).filter(([k]) => k !== page).map(([, l]) => l),
      ["https://whitepaper.imdusd.com/", "Whitepaper"],
      [`${SITE}/docs/overview/about/`, "About imdUSD and INFER"],
    ],
    table,
  );
};

/** The stats page: the dataset its figures come from. */
export const statsLd = () =>
  jsonLd(
    graph({
      "@type": "Dataset",
      name: "imdUSD on-chain history",
      description: "Event logs of imdUSD's public contracts on Ethereum mainnet since launch, as served by imdusd.com/api/v1.",
      url: `${SITE}/stats/`,
      creator: organization,
      about: { "@id": IMDUSD_ID },
      temporalCoverage: `${LAUNCHED}/..`,
      isAccessibleForFree: true,
      distribution: { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${SITE}/api/v1/meta` },
    }),
  );

export const docsIndexLd = (description) =>
  jsonLd(
    graph({
      "@type": "CollectionPage",
      name: "imdUSD docs",
      description,
      url: `${SITE}/docs/`,
      about: { "@id": IMDUSD_ID },
      publisher: organization,
    }),
  );

/** Questions and answers: `items` are { question, answer }, the page's own text. */
export const faqLd = (items) =>
  jsonLd(
    graph({
      "@type": "FAQPage",
      mainEntity: items.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    }),
  );

/** The day a file last changed in git (YYYY-MM-DD), for a sitemap's lastmod; "" when git cannot say. */
export const changedOn = (file) => {
  try {
    return execFileSync("git", ["log", "-1", "--format=%cs", "--", file], { cwd: dirname(file), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
};
export const urlEntry = (loc, day) => `  <url><loc>${loc}</loc>${day ? `<lastmod>${day}</lastmod>` : ""}</url>`;
