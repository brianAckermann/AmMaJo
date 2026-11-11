# American Mahjong Hand-Management Research

## Scope and rule baseline

AmMaJo is for American Mah Jongg, where a winning 14-tile hand must match a line on the annually changing NMJL card. The card determines the legal patterns; the normal play rules determine which decisions are legal. Rules below describe the common NMJL-style game, but tables can use house or tournament variations. The app should make its active rule set explicit.

The application should not reproduce a current NMJL card without permission. Instead, accept a user-provided/licensed card definition or offer original practice patterns.

## What a player manages

### Targets and flexibility

After viewing the deal, a player compares several card lines, looking for tiles already held, useful duplicates, compatible suits, required flowers/winds/dragons, and whether the line is exposed (`X`) or concealed (`C`). The important skill is not committing too early: retain multiple plausible lines until incoming tiles and the Charleston make one clearly stronger. A good practice engine should score both *progress toward each legal line* and *option value*—how many useful future tiles remain.

### Charleston choices

The Charleston is the first hand-shaping decision: pass three tiles right, across, then left; a second Charleston may follow by table agreement. Jokers cannot be passed. Pass tiles that do not support several plausible targets, but do not pass a concentrated gift that strongly advances an opponent—especially tiles that are likely useful across many card lines. Tiles received are information, not proof: they can suggest what upstream players rejected or passed blindly. Practice prompts should ask for a three-tile pass, show the candidate targets it strengthens or weakens, and explain the trade-off.

### Draw, discard, and exposure

On a normal turn, draw one tile and discard one. A player can claim another player's discard for a pung, kong, or quint in an exposed hand; a claim normally cannot complete a pair or single unless it wins the hand. Calling exposes the completed group, reveals the hand's direction, interrupts turn order, and locks the player into targets compatible with that exposure. A concealed-card line cannot be exposed or called for until the winning tile.

The decision is therefore more than “does this tile fit?”: compare immediate progress against lost flexibility, the information revealed, and the risk that opponents will avoid feeding the exposed need. A teaching flow should surface the legal calls first, then contrast “call,” “draw and discard,” and “discard defensively.”

### Jokers and visible information

Jokers can substitute only in groups of three or more, never singles or pairs. A natural tile can replace the matching joker in any exposure during the player's own turn, so exposed jokers create both an opportunity to acquire a flexible tile and a clue about the exposed group. Natural tiles, exposures, and discards are public information. As a round progresses, the app can track tile availability: a required single/pair may become impossible when all copies are visible; larger groups may remain viable if legal joker coverage is available.

### Defense and endgame

Opponent exposures narrow their possible card lines. Avoid discarding tiles that directly complete or extend an exposed group, particularly late in the wall. Prefer discards known to be unavailable or inconsistent with visible exposures, while balancing that safety against abandoning a near-complete own hand. If the wall runs out, it is a wall game; a practice app should teach when the expected value of continuing no longer justifies feeding another player.

## Product implications for the first practice mode

Build short, explainable scenarios rather than a full simulator first:

1. Present a rack, active card patterns, Charleston/pass or turn context, and visible table information.
2. Ask for one action: pass, discard, call, decline a call, or redeem a joker.
3. Validate legality before strategy.
4. Explain the best alternatives using: target progress, remaining outs, flexibility, exposure cost, and defensive risk.
5. Label uncertainty honestly; with hidden tiles, a recommendation is probabilistic rather than certain.

## Sources

- [American Mah Jongg Association: rules overview](https://www.americanmahjonggassociation.com/american-mah-jongg-rules) — game sequence, calls, concealment, joker limits, and dead-hand risks.
- [Mahjongg School: rules](https://mahjonggschool.com/rules) — claiming priority, exposure information, joker exchange timing, and house-rule differences.
- [Order of the Tile: American Mahjong rules](https://orderofthetile.com/rules/) — 152-tile composition, NMJL-oriented rules, and explicitly documented variants.
- [American Mah Jongg Primer Companion Edition (PDF)](https://mahjlife.com/wp-content/uploads/2024/04/American-Mah-Jongg-Primer-Companion-Edition-2024-20240403.1.pdf) — practical cautions on Charleston passing and common card/play errors.
