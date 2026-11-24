// Structured data (schema.org JSON-LD) for every site, and the static summary the homepage carries
// for readers that do not run JavaScript (search and answer-engine crawlers). One entity graph,
// so imdUSD, INFER and the docs resolve to the same names and addresses everywhere they appear.
//
// JSON-LD is a data block, not a script: the CSP does not apply to it and the one-inline-script
// check in vite.config.ts does not count it (it matches bare <script> only).

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

/**
 * The homepage's static summary, inside #root: what a crawler that does not run JavaScript reads.
 * React replaces it when the page's code mounts, so a visitor sees it only while that code loads.
 */
export const homeSummary = () => `<main class="prerender">
<h1>imdUSD</h1>
<p>${esc(imdusd.description)}</p>
<p>Live on Ethereum mainnet since 11 October 2026. imdUSD: <code>${IMDUSD}</code>. Vault: <code>${VAULT}</code>.</p>
<ul>
<li><a href="/docs/overview/what-is-imdusd/">What is imdUSD</a></li>
<li><a href="/docs/overview/how-it-holds-a-dollar/">How imdUSD holds a dollar</a></li>
<li><a href="/docs/reference/oracle-and-question-binding/">How the agent panels price the collateral</a></li>
<li><a href="/docs/economics/risks-and-open-questions/">Risks and open questions</a></li>
<li><a href="/docs/reference/contracts-and-addresses/">Contracts and addresses</a></li>
<li><a href="/stats/">Live figures</a></li>
<li><a href="${INFER_SITE}/">INFER, the protocol's token</a></li>
</ul>
</main>`;
