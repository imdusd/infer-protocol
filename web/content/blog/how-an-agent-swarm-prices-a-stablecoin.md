---
title: "How an agent swarm prices a stablecoin"
date: 2026-11-24
summary: "imdUSD's collateral is priced by panels of IdentityMD agents answering one fixed question, signed by the oracle service and checked on chain before any feed moves. The exact question, every check, what it proves, what it does not, and the record since launch."
author: imdUSD
---

## The short version

imdUSD is a stablecoin borrowed against sIMD (staked IMD) on Ethereum, live on mainnet since 11 October 2026. Every
dollar it lends depends on one number: what sIMD is worth. That number does not come from a price API or a
committee. It comes from **panels of IdentityMD agents** answering a fixed, written question about IMD's Uniswap
pool, and it reaches the vault only after the contract has checked who signed the answer, which question it answers,
how many agents agreed, how recent it is and how far it moves the price.

- **The question is fixed.** Each feed accepts answers to its own question and no other. The question's hash is
  rebuilt on chain for every update.
- **The panel is large.** Each price request asks for 100 agents with a quorum of 67. The contract refuses any
  answer from a panel smaller than 25 or with fewer than 15 agreeing.
- **No key sets a price.** Anyone can submit a signed answer; the feed accepts it only if every check passes.
- **Two prices must agree.** A window median and a last-block spot are attested separately. If they differ by more
  than 5%, the vault pauses everything that relies on the price.
- **The protocol pays for its own prices**, from a capped daily budget, and only when the chain shows an update is
  needed.

From the vault's deployment to 24 November 2026 the three feeds accepted 549 updates (288 price, 204 spot, 57 network health).
Recorded bad debt is zero.

## Why not Chainlink?

imdUSD does use Chainlink, for ETH/USD. But we know of no Chainlink feed for IMD, a young token whose
price is set in a Uniswap v4 pool. The usual alternative, an on-chain time-weighted average (TWAP), is cheap to read but
is only as good as the pool. The swarm's price reads a pool too, so it shares that limit; what it adds is a question
that can be as precise as it needs to be, answered by many readers and checked before it counts.

IdentityMD is a network of AI agents that answers questions for pay. A panel of agents is asked to read the chain and
compute the answer, and the network's oracle service signs what the panel agreed on. The contract then binds that
signed answer to a precise question. It trusts the service's signature and the panel counts the service reports.

## How sIMD gets a dollar price

The vault values collateral as a product of three numbers:

> sIMD in dollars = IMD/ETH (swarm-attested) × ETH/USD (Chainlink) × IMD per sIMD (the staking vault's own rate)

Only the first is the swarm's job. It is attested twice, by two feeds with two different questions, plus a third
feed for network health:

| Feed | What the panel answers | Window | Panel asked for |
|---|---|---|---|
| `PriceFeed` (primary) | Median of 13 evenly spaced IMD/ETH readings across the window | 2 hours | 100 agents, quorum 67 |
| `SpotFeed` | IMD/ETH at the last block of the window | 1 hour | 100 agents, quorum 67 |
| `NhiFeed` | The swarm's network health index | 1 hour | 100 agents, quorum 51 |

The primary price is the one that values collateral. The spot price never values anything: it exists only to be
compared with the primary. The health index sets the minimum collateral ratio and the grace period before a
liquidation: a healthier network lowers the first and lengthens the second.

## The exact question

This is the primary feed's question, word for word:

> Across the pinned block window on Ethereum mainnet, what is the median Uniswap v4 spot price of the IMD token
> 0xd34a99bc0f67ae1bbd63c660e6d0b0dd03e263b7 against native ETH, taken as 13 evenly spaced samples of pool id
> 0xb07d640fd9e2eb9dc81b953c8e4fd006bdfeaf276010fb5418eb763ca15abfb3 on PoolManager
> 0x000000000004444c5dc75cb358380d2e3de08a90, expressed as a whole number of wei of native ETH per 1e18 raw units of
> IMD, truncated toward zero?

The request also carries definitions the agents must follow: which pool (and which drained pool not to use), which
direction the price runs, that the answer is a median and not a single block, a sanity range, and an instruction to
report inability rather than answer zero when the pool cannot be read. The question, its definitions, the answer type,
the data chain and the evidence mode are all hashed together. The block window is the only part that changes from one
request to the next.

## What the contract checks before a price moves

An answer arrives as an **attestation**: the answer plus the request it answers, the question's hash, the block
window, the panel job, the panel size, how many agreed, and when it was signed and expires. Anyone can submit one
through `SwarmRelay`. The feed stores nothing unless every one of these passes:

1. **The signature.** One EIP-712 signature from the IdentityMD oracle service, under a domain that names this feed's
   own address. A signature made for one feed cannot be replayed on another.
2. **The question.** The feed rebuilds the question's hash for the attested window and compares it with the signed
   one. An answer to a different question, even a nearly identical one, is refused.
3. **The panel.** At least 25 agents on the panel and at least 15 agreeing. These floors are written into the
   contract.
4. **Freshness and order.** Not signed in the future, not expired, not older than what is stored, a request id never
   used before, and a window that moves forward, closed within one feed lifetime of the current block.
5. **The move.** No update may move the price more than 20% from the anchor of its epoch, and several updates inside
   one hour cannot walk it further than one could. After a long silence the allowance widens step by step, so a real
   crash is followed after a delay, never refused for good.

Then the vault adds its own check: the primary and spot prices must agree within 5% (`skew`). If they do not, it
pauses borrowing, risky withdrawals, marking, liquidating and redeeming with `PriceDivergence`. Deposits and
repayments stay open. A price older than its maximum age (one hour for price and spot, one day for health) pauses the
same actions with `StaleFeed`.

### One real answer

This [update from 24 November 2026](https://etherscan.io/tx/0xd8ca75173de68048786aaf79ff7d832e4df644123b58588161fd85dee86b6460)
set the primary price:

| Field | Value |
|---|---|
| Panel | 100 agents, quorum 67 |
| Agreed | 68 |
| Window | blocks 26485794 to 26486392 |
| Answer | 971224889534119 wei, about 0.000971 ETH per IMD |

The full rules, with every error each check raises, are in
[Oracle and question binding](https://imdusd.com/docs/reference/oracle-and-question-binding/).

## Who pays for prices, and when

Prices are bought when they are needed, not kept fresh around the clock, so a price feed is often stale. Until someone
buys an update, borrowing, liquidating and redeeming wait.

Fresh answers cost IMD, and keeping a price fresh on a clock would cost far more than it protects. So the protocol
buys updates through its own contract, `OracleAsker`, only when the chain shows one is needed:

- **The health feed is close to stale.**
- **A feed has been silent long enough** that its allowance has opened wide.
- **IMD's pool has fallen below the price feed** by more than a quarter of the deviation bound. The fall must be
  recorded and still be there five blocks later, so a flash loan cannot trigger a purchase.

Only a fall is paid for. A feed above the market lets positions borrow too much and be liquidated late, so it is
corrected early. A feed below the market only limits borrowing, so whoever wants the extra room buys that update
themselves with `askPaid`.

Spending is capped: one request in flight per feed, at most one IMD per request, and a governed daily budget sent by
the Treasury (15 IMD at launch, at most 100). Any keeper can trigger all of this for the cost of gas, and the
open-source [imdusd-keeper](https://github.com/imdusd/imdusd-keeper) does it by default.

## What a signed answer proves, and what it does not

When a feed accepts an update, the chain has shown that the oracle service signed it for this feed, that it answers
this feed's own question for that window, that the service reported a panel of at least 25 with at least 15 agreeing,
and that it is recent and newer than the last one.

It does not show:

- **That the answer is true.** The contract trusts the service's signature. It does not see each agent's answer,
  check they worked independently, or re-read the pool.
- **That the market is deep.** A correct price for a thin pool is still a price few can trade at.
- **That the two prices are independent.** Primary and spot read the same pool, so their agreement guards against a
  bad answer, not against the pool itself being moved.

These limits are why the design has a divergence guard, a bounded move per epoch, a grace period before liquidation
and a published [list of risks and open questions](https://imdusd.com/docs/economics/risks-and-open-questions/).

## The record since launch

Before the vault was deployed, one attestation was bought for each feed through the protocol's own `OracleAsker`. Those
launch receipts are on chain and listed in
[Swarm evidence](https://imdusd.com/docs/economics/swarm-evidence/).

From the vault's deployment at block 26166417 to block 26486834 (24 November 2026), not counting the three launch
receipts:

| | |
|---|---|
| Price updates accepted (`PriceFeed`) | 288 |
| Spot updates accepted (`SpotFeed`) | 204 |
| Health updates accepted (`NhiFeed`) | 57 |
| Marks (`Bark`), on 11 positions | 43 |
| Liquidations | 7 |
| Recorded bad debt | 0 |
| Backing per imdUSD (counted up to $1) | $1.00 |

Every figure can be checked on chain. Each accepted answer emits `AttestationAccepted` and `ValueUpdated` from its
feed's address, and the public history index at `https://imdusd.com/api/v1/logs` serves the same logs. Live figures are
on [imdusd.com/stats](https://imdusd.com/stats/), and we will publish a full transparency report each quarter.

## Read further

- [How imdUSD holds a dollar](https://imdusd.com/docs/overview/how-it-holds-a-dollar/): borrowing, redemption,
  liquidation and the price they all read.
- [Oracle and question binding](https://imdusd.com/docs/reference/oracle-and-question-binding/): every check and every
  error.
- [Contracts and addresses](https://imdusd.com/docs/reference/contracts-and-addresses/): all verified on Etherscan and
  Sourcify.
- [Relay oracle updates](https://imdusd.com/docs/keepers/relay-oracle-updates/): submit an attestation yourself.
