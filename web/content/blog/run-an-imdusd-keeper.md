---
title: "Run an imdUSD keeper"
date: 2026-11-24
summary: "Every keeper job in imdUSD is permissionless: buying price updates with the Treasury's IMD, relaying them, marking and liquidating unsafe positions. What each job pays, what you need to hold, and how to run the open-source keeper, starting with no key and no risk."
author: imdUSD
---

## The short version

imdUSD has no privileged keeper. Every action that keeps the vault working, from refreshing a price to liquidating a
position, can be called by anyone, and a protocol is safer with many keepers than with one. The open-source
[imdusd-keeper](https://github.com/imdusd/imdusd-keeper) (MIT) runs all of it from one process and one key.

- **It starts report-only.** Without `--execute` it reads the chain, prints what it would do and sends nothing.
- **Liquidating pays.** A liquidator repays a borrower's debt and receives sIMD worth that debt plus a 20% bonus,
  less the marker's and the protocol's shares (10% of the bonus each).
- **Keeping prices fresh costs only gas.** The Treasury pays for oracle updates; a keeper only has to ask.
- **You need ETH for gas**, plus imdUSD if you want to liquidate. Your own IMD is never spent unless you opt in.

From launch on 11 October to 24 November 2026 there were 43 marks, on 11 positions, and 7 liquidations. Recorded bad
debt is zero. Liquidations are occasional: expect long stretches with nothing to do.

## What a keeper does

The keeper runs five loops that take turns on one queue, so they never race each other for a nonce:

| Loop | What it does | Costs you | Earns you |
|---|---|---|---|
| **watch** | Asks the protocol's `OracleAsker` to buy a price update with the Treasury's IMD when the chain shows one is needed, and tops up its budget with `Treasury.fundOracle()` | Gas | Nothing directly: a fresh price is what makes liquidations and redemptions possible |
| **relay** | Puts signed oracle answers on chain through the permissionless `SwarmRelay` when the oracle's own callback has not | Gas | Nothing directly |
| **positions** | Finds every position, marks (`bark`) those below the minimum collateral ratio and liquidates (`bite`) them after the grace period | Gas and imdUSD inventory | The liquidation bonus in sIMD, plus the marker's share for positions it marked |
| **pace** | Keeps the paced figures redemptions use up to date | Gas | Nothing: a public good. Off by default |
| **drip** | Streams the Treasury's INFER to stakers when nobody else has for 75 minutes | Gas | 1% of each release, in INFER. Off by default |

## How liquidation works

Liquidation takes two transactions with a wait between them.

1. **Mark.** When a position's collateral ratio falls below `mat` (170% today), anyone can mark it with `bark`. The
   mark records the time, the marker, and a grace period read from the network health index at that moment (six hours
   today). Marking a safe position reverts.
2. **Grace.** The borrower has until the grace ends to deposit or repay. A deposit or
   repayment that restores the ratio while prices are live clears the mark; a recovery through price alone leaves it
   until someone clears it with `heel`.
3. **Liquidate.** From the end of grace, for one hour (`tail`), anyone can liquidate with `bite` while the position is
   still unsafe. You repay part or all of the debt with your own imdUSD, which is burned, and receive sIMD worth the
   debt repaid plus the bonus. After that hour the mark expires and the position must be marked again.

Every step needs live prices: all feeds fresh, and the primary and spot IMD/ETH prices within 5% of each other.
Otherwise the call reverts with `StaleFeed` or `PriceDivergence`. Price feeds are often stale by design: the Treasury
buys an update when IMD falls, not on a clock, and the keeper's watch and relay loops trigger and land it.

## What you earn

The bonus is 20% of the debt repaid, written into the contract. Governance splits it three ways, currently:

| Part | Share of the bonus | Goes to |
|---|---|---|
| `chip` | 10% | Whoever marked the position |
| `cut` | 10% | The Treasury |
| The rest | 80% | The liquidator, on top of the full value of the debt repaid |

On $100 of debt repaid the bonus is $20: $2 to the marker, $2 to the Treasury and $16 to a liquidator who did not
mark. A keeper that marks what it liquidates keeps $18. The borrower loses the same amount however it is split.

Liquidators are also credited three days of holding points per imdUSD repaid. See
[Points and seasons](https://imdusd.com/docs/economics/points-and-seasons/).

## What you need

| Balance | Needed for | How much |
|---|---|---|
| **ETH** | Every transaction | 0.03 to 0.05 ETH to start. Routine jobs stop sending below a reserve, so gas is kept for liquidations |
| **imdUSD** | Liquidating | As much as you want to be able to repay. It is working capital, not an expense: at the vault's price, a liquidation returns more value in sIMD than it burns. Buy it in the imdUSD/USDC pool, or borrow it from the vault |
| **IMD** | Only if you opt in to buying updates yourself | 0.5 IMD per update, capped per UTC day |

Use a fresh wallet that holds nothing but the keeper's operating balance.

## Run it in five minutes, with no key

You need Node.js 20.6 or later.

```bash
git clone https://github.com/imdusd/imdusd-keeper && cd imdusd-keeper
npm install
cp config.example.js config.js     # works as is; no secrets go in this file
npm run verify-deployment          # checks the shipped contract record against the chain
node index.mjs --once              # one report-only pass of every loop
```

Each loop prints its full reasoning: which positions it found, which are unsafe, what it would mark or liquidate,
and whether a price update is due. Run it report-only for a day before you give it a key.

## Choose a setup

Set the loops you want in `config.js`. Every setup starts report-only; add `--execute` once the reports look right.

- **Observer.** No key, no funds. The default.
- **Liquidator.** `LOOPS: ["relay", "positions"]`. Earns the bonus; needs ETH and imdUSD. Add `"watch"` to make more
  liquidations possible after a price fall.
- **Oracle helper.** `LOOPS: ["watch", "relay"]`. A public good for the cost of gas: the Treasury pays for the updates it
  buys, within its daily budget.
- **Full keeper.** All five loops, with pace and drip enabled.
- **Oracle sponsor.** Any setup, plus a daily cap of your own IMD to keep prices fresh when the Treasury will not pay,
  for example in a rally, or to reopen a vault paused because primary and spot disagree.

For long-running use, the repository ships a systemd user unit, so the keeper never runs as root. Configuration,
output and operations are in the [README](https://github.com/imdusd/imdusd-keeper#readme).

## The risks you carry

- **Price risk.** You are paid in sIMD, whose value moves with IMD, until you unstake and sell. sIMD received in a block
  cannot be unstaked in the same block.
- **Races.** Other keepers can mark, liquidate or relay first. `relayAndBite` closes the gap between your price update
  and your liquidation, but not the race into the block.
- **Small positions.** Gas must cost less than the part of the bonus you keep.
- **Paused prices.** Stale or disagreeing feeds halt every action that pays you until someone refreshes them.
- **Stranded rewards.** If `SwarmRelay` is recorded as a position's marker and the position is then liquidated
  directly, the marker's share cannot be recovered. Mark with `relayAndBark` or `barkFor` naming your own address.

## Read further

- [How liquidation works](https://imdusd.com/docs/keepers/how-liquidation-works/) and
  [Mark and liquidate](https://imdusd.com/docs/keepers/mark-and-liquidate/): every rule and error.
- [Keeper economics](https://imdusd.com/docs/keepers/keeper-economics/): the bonus, the balances and the risks.
- [Relay oracle updates](https://imdusd.com/docs/keepers/relay-oracle-updates/): submit a signed answer by hand.
- [How an agent swarm prices a stablecoin](https://blog.imdusd.com/how-an-agent-swarm-prices-a-stablecoin/): where the
  prices a keeper acts on come from.
