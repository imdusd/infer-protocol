---
title: Questions and answers
section: overview
order: 5
description: Answers about imdUSD and INFER, with the contract address, what backs the stablecoin, how AI agents price it, how to redeem it, and what can go wrong.
audience: everyone
faq: true
sources:
  - src/ParameterizedVault.sol:142-154
  - src/CDPVault.sol:432-490
  - src/SwarmFeed.sol:26-156
---

# Questions and answers

Short answers about imdUSD and INFER, each with the page that has the detail.

## What is imdUSD?

imdUSD is a stablecoin meant to be worth one US dollar. You get it by locking staked IMD (sIMD) in a vault on Ethereum and borrowing imdUSD against it. Its collateral is priced by panels of IdentityMD agents, and each price is checked on chain before the vault uses it. See [What is imdUSD](./what-is-imdusd.md).

## Is imdUSD live?

Yes. The vault was deployed on Ethereum mainnet on 11 October 2026, at block 26166417.

## What is the imdUSD contract address?

imdUSD on Ethereum mainnet is `0x61aAF8a992A3143e2B0C9cB0030b9fE702854a25`. The vault is `0x0b69F8DA8D8cE521d74Ea69a7A3475B77302EF82`. Every address is in [Contracts and addresses](../reference/contracts-and-addresses.md).

## Is imdUSD the same as imUSD or iUSD?

No. imdUSD, with a "d", is the stablecoin borrowed against staked IMD at imdusd.com. imUSD and iUSD are names used by other, unrelated projects. Check the contract address before you trade.

## What is the difference between imdUSD, IMD, sIMD and INFER?

- **imdUSD** is the stablecoin.
- **IMD** is the token of IdentityMD, the agent network. imdUSD did not issue it.
- **sIMD** is staked IMD, the collateral that backs imdUSD.
- **INFER** is the imdUSD protocol's own token. It is not a stablecoin.

## What backs imdUSD?

Two things: the sIMD locked in borrowers' positions, each of which must be worth more than its debt when it borrows, and a reserve in the protocol's Treasury. See [How imdUSD holds a dollar](./how-it-holds-a-dollar.md).

## How do AI agents price the collateral?

A panel of IdentityMD agents answers one fixed question about IMD's price in ETH, and the IdentityMD oracle service signs the answer. Anyone can submit it. The contract accepts it only if the signature, the question, the panel size, the freshness and the size of the move all pass. Chainlink supplies ETH/USD. See [Oracle and question binding](../reference/oracle-and-question-binding.md).

## Can anyone set the price?

No key can write a price directly. The contracts do trust the IdentityMD oracle service's signature: they check which question it answered and how many agents it reports, but they cannot see the agents' work. See [Risks and open questions](../economics/risks-and-open-questions.md).

## Can imdUSD lose its peg?

Yes. Redemption pays up to $ 1 of sIMD per imdUSD, less a fee, which supports the price from below. Nothing in the contracts pulls the price down from above $ 1. If backing falls below $ 1 per imdUSD, redemption pays less than $ 1, and it waits while prices are stale or disagree.

## How do I redeem imdUSD?

Burn it in the vault and receive sIMD worth up to $ 1 each, less a fee between 0.5% and 5%. You can unstake the sIMD for IMD from the next block. See [Redeem](../guides/redeem.md).

## Where can I buy imdUSD?

In the imdUSD/USDC pool on Uniswap v4, or borrow it from the vault against IMD or sIMD. Pin the pool by its id, not by the token names: the id is in [The peg pool](./the-peg-pool.md).

## What happens if my position falls below the minimum ratio?

Anyone can mark it. A grace period then starts, during which you can deposit or repay. After it, a keeper can repay your debt and take sIMD worth that amount plus a 20% bonus, valued at the vault's price. See [How liquidation works](../keepers/how-liquidation-works.md).

## Why are prices sometimes stale?

Updates cost money, so the Treasury buys one when it is needed, not on a clock. While a price is stale, borrowing, withdrawing against debt, liquidating and redeeming wait. Depositing and repaying stay open. Anyone can buy an update at any time.

## Has imdUSD been audited?

The contracts were reviewed thirty times by IdentityMD swarm panels and in-house reviews. None of these is a report from a third-party audit firm. Every record is in [Audit history](../reference/audit-history.md).

## Who controls imdUSD?

The contracts cannot be upgraded or paused by a key. A multisig that needs two of its three signers can change economic settings, only within hard limits in the contracts and only after a public 48-hour delay. There is no token vote. See [Parameters](../governance/parameters.md).

## Is there an insurance fund?

No. A liquidation can leave bad debt. It can be cancelled with imdUSD the Treasury holds, but only as far as the Treasury has it.

## What does INFER do?

INFER has a fixed supply of 1 billion. Staked as sINFER, it receives INFER the Treasury buys with protocol revenue. INFER is also paid to people who use imdUSD, in point seasons. Revenue is not guaranteed. See [infer.imdusd.com](https://infer.imdusd.com/tokenomics/).

## How do I reach the team or report a vulnerability?

Email admin@imdusd.com, or message [@imdusd](https://x.com/imdusd) on X. Report a vulnerability privately by email, not in a public issue.
