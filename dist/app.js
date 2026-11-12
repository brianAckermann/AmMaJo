const $ = (selector) => document.querySelector(selector);
const HISTORY_KEY = "ammajo-practice-history-v1";
const TILE_SET_KEY = "ammajo-tile-set-v1";
const SORT_RULES_KEY = "ammajo-sort-rules-v1";
const TILE_SETS = ["garden", "clear", "ink", "blush", "night", "contrast"];
const DEFAULT_SORT_RULES = [
  { id: "dot", label: "Dots", enabled: true }, { id: "bam", label: "Bams", enabled: true },
  { id: "crak", label: "Craks", enabled: true }, { id: "flower", label: "Flowers", enabled: true },
  { id: "dragon", label: "Dragons", enabled: true }, { id: "wind", label: "Winds", enabled: true },
  { id: "joker", label: "Jokers", enabled: true }, { id: "reject", label: "Known rejects", enabled: true }
];
const suitMeta = { bam: ["🎋", "Bams"], dot: ["◉", "Dots"], crak: ["萬", "Craks"] };
const windGlyphs = { E: "🀀", S: "🀁", W: "🀂", N: "🀃" };
const dragonGlyphs = { R: "🀄", G: "🀅", S: "🀆" };
const suitGlyphBase = { crak: 0x1F007, bam: 0x1F010, dot: 0x1F019 };

let state = emptyState();
let timerId;
let tileSet = TILE_SETS.includes(localStorage.getItem(TILE_SET_KEY)) ? localStorage.getItem(TILE_SET_KEY) : "garden";
let sortRules = loadSortRules();

function emptyState() {
  return { deck: [], hand: [], traded: [], discards: [], phase: "start", charleston: 0, round: 0, selected: [], choices: [], decisions: 0, startedAt: 0, roundStartedAt: 0, roundDurations: [], rejectIds: new Set(), rejectMode: false };
}

function loadSortRules() {
  try {
    const saved = JSON.parse(localStorage.getItem(SORT_RULES_KEY));
    if (!Array.isArray(saved)) return DEFAULT_SORT_RULES.map((rule) => ({ ...rule }));
    const valid = new Map(saved.filter((rule) => DEFAULT_SORT_RULES.some((base) => base.id === rule.id)).map((rule) => [rule.id, rule]));
    return [...valid.values(), ...DEFAULT_SORT_RULES.filter((rule) => !valid.has(rule.id))].map((rule) => ({ id: rule.id, label: DEFAULT_SORT_RULES.find((base) => base.id === rule.id).label, enabled: rule.enabled !== false }));
  } catch { return DEFAULT_SORT_RULES.map((rule) => ({ ...rule })); }
}
function saveSortRules() { localStorage.setItem(SORT_RULES_KEY, JSON.stringify(sortRules)); }

function makeDeck() {
  const deck = [];
  ["bam", "dot", "crak"].forEach((suit) => { for (let number = 1; number <= 9; number += 1) for (let copy = 0; copy < 4; copy += 1) deck.push({ id: `${suit}-${number}-${copy}`, type: suit, number }); });
  ["N", "E", "W", "S"].forEach((wind) => { for (let copy = 0; copy < 4; copy += 1) deck.push({ id: `wind-${wind}-${copy}`, type: "wind", label: wind }); });
  [["red", "R"], ["green", "G"], ["soap", "S"]].forEach(([name, label]) => { for (let copy = 0; copy < 4; copy += 1) deck.push({ id: `dragon-${name}-${copy}`, type: "dragon", label, name }); });
  for (let copy = 0; copy < 8; copy += 1) deck.push({ id: `flower-${copy}`, type: "flower", label: "✿", variant: copy + 1 });
  for (let copy = 0; copy < 8; copy += 1) deck.push({ id: `joker-${copy}`, type: "joker", label: "JOKER" });
  return shuffle(deck);
}

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}
function draw() { return state.deck.pop(); }
function drawEligible(predicate) { const index = state.deck.findIndex(predicate); return index < 0 ? draw() : state.deck.splice(index, 1)[0]; }
function sortRuleIndex(tile) {
  const enabled = sortRules.filter((rule) => rule.enabled);
  const rejectIndex = enabled.findIndex((rule) => rule.id === "reject");
  if (state.rejectIds.has(tile.id) && rejectIndex >= 0) return rejectIndex;
  const index = enabled.findIndex((rule) => rule.id === tile.type);
  return index < 0 ? Number.MAX_SAFE_INTEGER : index;
}
function tileOrder(tile) {
  if (tile.number) return tile.number;
  if (tile.type === "wind") return { E: 1, S: 2, W: 3, N: 4 }[tile.label];
  if (tile.type === "dragon") return { red: 1, green: 2, soap: 3 }[tile.name];
  return tile.variant || Number(tile.id.split("-").at(-1)) || 0;
}
function sortHand(force = false) { if (state.manualOrder && !force) return; state.hand.sort((a, b) => (sortRuleIndex(a) - sortRuleIndex(b)) || (tileOrder(a) - tileOrder(b)) || a.id.localeCompare(b.id)); }
function applyAutoSort() { sortHand(true); state.manualOrder = true; render(); }
function valueSortGroups() {
  const groups = [];
  sortRules.filter((rule) => rule.enabled).forEach((rule) => {
    const group = ["dot", "bam", "crak"].includes(rule.id) ? "suited" : rule.id;
    if (!groups.includes(group)) groups.push(group);
  });
  return groups;
}
function sortByValue() {
  const groups = valueSortGroups();
  const groupIndex = (tile) => {
    if (state.rejectIds.has(tile.id) && groups.includes("reject")) return groups.indexOf("reject");
    const group = ["dot", "bam", "crak"].includes(tile.type) ? "suited" : tile.type;
    const index = groups.indexOf(group); return index < 0 ? Number.MAX_SAFE_INTEGER : index;
  };
  const suitIndex = { dot: 0, bam: 1, crak: 2 };
  state.hand.sort((a, b) => (groupIndex(a) - groupIndex(b)) || ((suitIndex[a.type] !== undefined && suitIndex[b.type] !== undefined) ? (a.number - b.number) || (suitIndex[a.type] - suitIndex[b.type]) : tileOrder(a) - tileOrder(b)) || a.id.localeCompare(b.id));
  state.manualOrder = true; render();
}
function tileName(tile) { if (suitMeta[tile.type]) return `${tile.number} ${suitMeta[tile.type][1]}`; if (tile.type === "flower") return "Flower"; if (tile.type === "joker") return "Joker"; return tile.type === "wind" ? `${tile.label} Wind` : `${tile.name} Dragon`; }
function suitGlyph(tile) { return String.fromCodePoint(suitGlyphBase[tile.type] + tile.number - 1); }
function tileAssetName(tile) {
  if (suitMeta[tile.type]) return `${tile.type}-${tile.number}`;
  if (tile.type === "flower") return `flower-${tile.variant || 1}`;
  if (tile.type === "joker") return "joker";
  if (tile.type === "wind") return `wind-${{ E: "east", S: "south", W: "west", N: "north" }[tile.label]}`;
  return `dragon-${tile.name === "soap" ? "white" : tile.name}`;
}
function tileAssetPath(tile) { return `assets/joker-bloom/${tileSet}/${tileAssetName(tile)}.svg`; }

function tileElement(tile, { selectable = false, facedown = false } = {}) {
  const button = document.createElement(selectable ? "button" : "div");
  button.className = `tile ${tile.type}${tile.type === "dragon" ? ` dragon-${tile.name}` : ""}${facedown ? " face-down" : ""}${state.selected.includes(tile.id) ? " selected" : ""}`;
  button.setAttribute("aria-label", facedown ? "Face-down draw" : tileName(tile));
  if (selectable) button.type = "button";
  button.innerHTML = `<img class="tile-art" src="${facedown ? `assets/joker-bloom/${tileSet}/back.svg` : tileAssetPath(tile)}" alt="" />`;
  return button;
}

function startSession() {
  state = emptyState(); state.deck = makeDeck(); state.hand = Array.from({ length: 13 }, draw); sortHand(); state.phase = "charleston"; state.startedAt = Date.now();
  $("#start-card").classList.add("hidden"); $("#game").classList.remove("hidden"); $("#declare-button").disabled = false;
  render(); startTimer();
}

function startTimer() { clearInterval(timerId); timerId = setInterval(() => { if (state.startedAt) $("#timer").textContent = formatTime((Date.now() - state.startedAt) / 1000); }, 1000); }
function formatTime(seconds) { const value = Math.max(0, Math.round(seconds)); return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`; }

function render() {
  sortHand(); const rack = $("#rack"); rack.innerHTML = "";
  state.hand.forEach((tile) => {
    const isJokerLocked = state.phase === "charleston" && tile.type === "joker";
    const item = tileElement(tile, { selectable: true });
    if (isJokerLocked) item.classList.add("locked");
    if (state.newTileIds?.has(tile.id)) item.classList.add("is-new");
    if (state.rejectIds.has(tile.id)) { item.classList.add("known-reject"); item.title = "Known reject"; }
    item.draggable = true; item.dataset.tileId = tile.id;
    item.addEventListener("dragstart", (event) => { state.draggedId = tile.id; event.dataTransfer.effectAllowed = "move"; requestAnimationFrame(() => item.classList.add("dragging")); });
    item.addEventListener("dragend", clearDragState);
    item.addEventListener("click", () => selectTile(tile)); rack.append(item);
  });
  rack.addEventListener("dragover", updateInsertionMarker);
  rack.addEventListener("drop", (event) => { event.preventDefault(); reorderTileAt(state.draggedId, state.insertionIndex ?? state.hand.length); });
  $("#rack-count").textContent = state.hand.length; $("#deck-count").textContent = state.deck.length; $("#decision-count").textContent = state.decisions;
  $("#mark-rejects").classList.toggle("is-active", state.rejectMode); $("#mark-rejects").setAttribute("aria-pressed", state.rejectMode);
  $("#discard-log").innerHTML = state.discards.map((tile) => `<span class="mini-discard">${tileName(tile)}</span>`).join("");
  renderPhase();
}

function updateInsertionMarker(event) {
  event.preventDefault(); const items = [...event.currentTarget.querySelectorAll(".tile")]; const target = event.target.closest(".tile");
  document.querySelectorAll(".insert-before,.insert-after").forEach((el) => el.classList.remove("insert-before", "insert-after"));
  if (!target) { state.insertionIndex = items.length; return; }
  const index = items.indexOf(target); const after = event.clientX > target.getBoundingClientRect().left + target.getBoundingClientRect().width / 2;
  state.insertionIndex = index + (after ? 1 : 0); target.classList.add(after ? "insert-after" : "insert-before");
}

function clearDragState() {
  state.draggedId = null; state.insertionIndex = null;
  document.querySelectorAll(".dragging,.insert-before,.insert-after").forEach((el) => el.classList.remove("dragging", "insert-before", "insert-after"));
}

function reorderTileAt(fromId, insertionIndex) {
  const from = state.hand.findIndex((tile) => tile.id === fromId); if (from < 0) return clearDragState();
  const [tile] = state.hand.splice(from, 1); const destination = Math.max(0, Math.min(state.hand.length, insertionIndex - (from < insertionIndex ? 1 : 0)));
  state.hand.splice(destination, 0, tile); state.manualOrder = true; clearDragState(); render();
}

function renderPhase() {
  const label = $("#phase-label"), instruction = $("#instruction"), helper = $("#helper-text"), action = $("#primary-action"), selected = $("#selected-label"), choiceZone = $("#choice-zone");
  $("#game").classList.toggle("is-choosing-draw", state.phase === "choose");
  choiceZone.classList.add("hidden");
  if (state.phase === "charleston") {
    const directions = ["RIGHT", "ACROSS", "LEFT"];
    label.textContent = `CHARLESTON · PASS ${state.charleston + 1} OF 3 · ${directions[state.charleston]}`;
    instruction.textContent = "Choose 3 tiles to trade"; helper.textContent = "Trade unwanted non-jokers for random tiles from the practice pool.";
    selected.textContent = `${state.selected.length} of 3 tiles selected`; action.textContent = state.charleston === 2 ? "Finish Charleston" : "Trade selected tiles"; action.disabled = state.selected.length !== 3;
    return;
  }
  if (state.phase === "choose") {
    label.textContent = `ROUND ${state.round} OF 25 · CHOOSE A DRAW`; instruction.textContent = "Pick one of the two tiles"; helper.textContent = state.choices[0]?.tile.type === "joker" ? "A discarded Joker cannot be claimed. Take the face-down draw instead." : "The unused practice tile returns to the pool. Then choose one tile from your rack to discard.";
    selected.textContent = "Choose a draw to continue"; action.classList.add("hidden"); choiceZone.classList.remove("hidden"); renderChoices(); return;
  }
  label.textContent = `ROUND ${state.round} OF 25 · DISCARD`; instruction.textContent = "Choose one tile to discard"; helper.textContent = "Your discard is kept face up in this practice record.";
  selected.textContent = `${state.selected.length ? tileName(state.hand.find((t) => t.id === state.selected[0])) : "Select one tile"} ${state.selected.length ? "ready to discard" : ""}`; action.classList.remove("hidden"); action.textContent = state.round === 25 ? "Finish practice hand" : "Discard & next round"; action.disabled = state.selected.length !== 1;
}

function renderChoices() {
  const holder = $("#draw-options"); holder.innerHTML = "";
  state.choices.forEach((choice) => {
    const element = tileElement(choice.tile, { selectable: true, facedown: !choice.faceup });
    if (!choice.claimable) { element.disabled = true; element.classList.add("unavailable"); element.title = "A discarded Joker cannot be claimed"; }
    element.addEventListener("click", () => chooseDraw(choice.tile.id)); holder.append(element);
  });
}

function selectTile(tile) {
  if (state.rejectMode) {
    if (state.rejectIds.has(tile.id)) state.rejectIds.delete(tile.id); else state.rejectIds.add(tile.id);
    render(); return;
  }
  if (state.phase === "choose" || (state.phase === "charleston" && tile.type === "joker")) return;
  const existing = state.selected.indexOf(tile.id);
  if (existing >= 0) state.selected.splice(existing, 1);
  else if ((state.phase === "charleston" && state.selected.length < 3) || (state.phase === "discard" && state.selected.length < 1)) state.selected.push(tile.id);
  render();
}

function primaryAction() {
  if (state.phase === "charleston") doTrade(); else if (state.phase === "discard") doDiscard();
}
function doTrade() {
  const ids = new Set(state.selected); const outgoing = state.hand.filter((tile) => ids.has(tile.id)); state.hand = state.hand.filter((tile) => !ids.has(tile.id)); state.traded.push(...outgoing); const incoming = [drawEligible((tile) => tile.type !== "joker"), drawEligible((tile) => tile.type !== "joker"), drawEligible((tile) => tile.type !== "joker")]; state.hand.push(...incoming); state.newTileIds = new Set(incoming.map((tile) => tile.id)); state.manualOrder = true; state.selected = []; state.decisions += 1; state.charleston += 1;
  if (state.charleston === 3) { state.phase = "choose"; state.round = 1; openChoices(); } render();
}
function openChoices() { const faceup = draw(); state.newTileIds = new Set(); state.roundStartedAt = Date.now(); state.choices = [{ tile: faceup, faceup: true, claimable: faceup.type !== "joker" }, { tile: draw(), faceup: false, claimable: true }]; }
function chooseDraw(id) {
  const picked = state.choices.find((choice) => choice.tile.id === id); if (!picked?.claimable) return;
  const unused = state.choices.find((choice) => choice.tile.id !== id); state.hand.push(picked.tile); state.newTileIds = new Set([picked.tile.id]); if (unused.faceup && unused.tile.type === "joker") state.discards.push(unused.tile); else state.deck.unshift(unused.tile); state.choices = []; state.phase = "discard"; state.selected = []; state.decisions += 1; render();
}
function doDiscard() {
  const id = state.selected[0]; const tile = state.hand.find((item) => item.id === id); state.hand = state.hand.filter((item) => item.id !== id); state.discards.push(tile); state.selected = []; state.decisions += 1;
  state.roundDurations.push((Date.now() - state.roundStartedAt) / 1000);
  if (state.round >= 25) return finish(false);
  state.round += 1; state.phase = "choose"; openChoices(); render();
}

function finish(declared) {
  state.phase = "finished"; clearInterval(timerId); $("#score-title").textContent = declared ? "Mahjong declared!" : "Practice hand complete"; $("#score-copy").textContent = declared ? "Record zero tiles away, or adjust it to reflect your own assessment." : "How many tiles from Mahjong did your hand feel? This is a personal practice note, not official scoring.";
  $("#tiles-away").value = declared ? 0 : 3; $("#away-value").textContent = $("#tiles-away").value; $("#score-dialog").showModal();
}
function saveScore() {
  const away = Number($("#tiles-away").value); const history = getHistory();
  history.push({ id: crypto.randomUUID(), date: new Date().toISOString(), declared: $("#score-title").textContent.includes("declared"), tilesAway: away, rounds: state.round, duration: (Date.now() - state.startedAt) / 1000, avgRound: state.roundDurations.length ? state.roundDurations.reduce((a, b) => a + b, 0) / state.roundDurations.length : 0 });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); $("#score-dialog").close(); state = emptyState(); $("#game").classList.add("hidden"); $("#start-card").classList.remove("hidden"); renderHistory();
}
function getHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; } }
function renderHistory() {
  const history = getHistory(); const hands = history.length; const declared = history.filter((hand) => hand.declared).length; const average = (key) => hands ? history.reduce((sum, item) => sum + item[key], 0) / hands : 0;
  $("#metric-hands").textContent = hands; $("#metric-mahjong").textContent = hands ? `${declared}/${hands}` : "—"; $("#metric-away").textContent = hands ? average("tilesAway").toFixed(1) : "—"; $("#metric-time").textContent = hands ? formatTime(average("avgRound")) : "—";
  const outcome = $("#outcome-chart"), distance = $("#distance-chart"), time = $("#time-chart");
  if (!hands) { outcome.className = "outcome-chart chart-empty"; distance.className = "bar-chart chart-empty"; time.className = "bar-chart chart-empty"; outcome.textContent = "Complete a hand to see your first chart."; distance.textContent = "Your self-assessment will appear here."; time.textContent = "Timing begins with your first practice hand."; return; }
  outcome.className = "outcome-chart"; const unfinished = hands - declared; const maximum = Math.max(declared, unfinished, 1); outcome.innerHTML = outcomeItem("Declared", declared, maximum) + outcomeItem("Other", unfinished, maximum);
  distance.className = "bar-chart"; time.className = "bar-chart"; distance.innerHTML = bars(history, "tilesAway", 13, "tiles"); const maxTime = Math.max(...history.map((h) => h.avgRound), 10); time.innerHTML = bars(history, "avgRound", maxTime, "s");
}

function renderStarterPreviews() { document.querySelectorAll(".preview-tile").forEach((image) => { image.src = `assets/joker-bloom/${tileSet}/${image.dataset.asset}.svg`; }); }
function outcomeItem(label, count, max) { return `<div class="outcome-item"><div class="outcome-bar" style="height:${Math.max(12, count / max * 105)}px">${count}</div><span>${label}</span></div>`; }
function bars(history, key, max, suffix) { return history.slice(-12).map((item, index) => { const value = item[key]; const height = Math.max(7, value / max * 116); const show = key === "avgRound" ? Math.round(value) : value; return `<div class="bar-unit" style="height:${height}px"><b>${show}${suffix}</b><span>${history.length - Math.min(history.length, 12) + index + 1}</span></div>`; }).join(""); }

function renderSortRules() {
  const holder = $("#sort-rules"); holder.innerHTML = "";
  sortRules.forEach((rule) => {
    const item = document.createElement("div"); item.className = "sort-rule"; item.draggable = true; item.dataset.ruleId = rule.id;
    item.innerHTML = `<span class="sort-grip" aria-label="Drag ${rule.label} to reorder" role="button" tabindex="0">⠿</span><label><input type="checkbox" ${rule.enabled ? "checked" : ""} /> <span>${rule.label}</span></label>`;
    item.querySelector("input").addEventListener("change", (event) => { rule.enabled = event.target.checked; });
    const grip = item.querySelector(".sort-grip");
    const finishPointerSort = (event) => {
      if (state.draggedRuleId !== rule.id) return;
      if (grip.hasPointerCapture(event.pointerId)) grip.releasePointerCapture(event.pointerId);
      const order = [...holder.querySelectorAll(".sort-rule")].map((element) => element.dataset.ruleId);
      sortRules.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      state.draggedRuleId = null; document.body.classList.remove("sorting-rules");
      document.querySelectorAll(".drag-target,.dragging-rule").forEach((element) => element.classList.remove("drag-target", "dragging-rule"));
    };
    grip.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse") return;
      event.preventDefault(); state.draggedRuleId = rule.id; grip.setPointerCapture(event.pointerId);
      item.classList.add("dragging-rule"); document.body.classList.add("sorting-rules");
    });
    grip.addEventListener("pointermove", (event) => {
      if (state.draggedRuleId !== rule.id) return;
      event.preventDefault();
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".sort-rule");
      if (!target || target === item || target.parentElement !== holder) return;
      const rect = target.getBoundingClientRect();
      holder.insertBefore(item, event.clientY < rect.top + rect.height / 2 ? target : target.nextSibling);
      document.querySelectorAll(".drag-target").forEach((element) => element.classList.remove("drag-target")); target.classList.add("drag-target");
    });
    grip.addEventListener("pointerup", finishPointerSort);
    grip.addEventListener("pointercancel", finishPointerSort);
    grip.addEventListener("keydown", (event) => {
      if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault(); const from = sortRules.findIndex((candidate) => candidate.id === rule.id);
      const to = Math.max(0, Math.min(sortRules.length - 1, from + (event.key === "ArrowUp" ? -1 : 1)));
      if (from === to) return;
      const [moved] = sortRules.splice(from, 1); sortRules.splice(to, 0, moved); renderSortRules();
      holder.querySelector(`[data-rule-id="${rule.id}"] .sort-grip`)?.focus();
    });
    item.addEventListener("dragstart", (event) => { state.draggedRuleId = rule.id; event.dataTransfer.effectAllowed = "move"; requestAnimationFrame(() => item.classList.add("dragging-rule")); });
    item.addEventListener("dragend", () => { state.draggedRuleId = null; document.querySelectorAll(".drag-target,.dragging-rule").forEach((element) => element.classList.remove("drag-target", "dragging-rule")); });
    item.addEventListener("dragover", (event) => { event.preventDefault(); document.querySelectorAll(".drag-target").forEach((element) => element.classList.remove("drag-target")); item.classList.add("drag-target"); });
    item.addEventListener("drop", (event) => {
      event.preventDefault(); const from = sortRules.findIndex((candidate) => candidate.id === state.draggedRuleId); const to = sortRules.findIndex((candidate) => candidate.id === rule.id);
      if (from >= 0 && to >= 0 && from !== to) { const [moved] = sortRules.splice(from, 1); sortRules.splice(to, 0, moved); }
      state.draggedRuleId = null; renderSortRules();
    });
    holder.append(item);
  });
}

$("#start-practice").addEventListener("click", startSession); $("#new-session").addEventListener("click", startSession); $("#clear-selection").addEventListener("click", () => { state.selected = []; render(); }); $("#primary-action").addEventListener("click", primaryAction); $("#declare-button").addEventListener("click", () => finish(true));
$("#auto-sort").addEventListener("click", applyAutoSort);
$("#sort-by-value").addEventListener("click", sortByValue);
$("#mark-rejects").addEventListener("click", () => { state.rejectMode = !state.rejectMode; state.selected = []; render(); });
$("#customize-sort").addEventListener("click", () => { renderSortRules(); $("#sort-dialog").showModal(); });
$("#sort-form").addEventListener("submit", (event) => { if (event.submitter?.id !== "apply-sort") return; event.preventDefault(); saveSortRules(); $("#sort-dialog").close(); applyAutoSort(); });
$("#tiles-away").addEventListener("input", (event) => { $("#away-value").textContent = event.target.value; }); $("#score-form").addEventListener("submit", (event) => { if (event.submitter.value === "cancel") { event.preventDefault(); $("#score-dialog").close(); state.phase = "discard"; startTimer(); render(); } else { event.preventDefault(); saveScore(); } });
document.querySelectorAll(".nav-button").forEach((button) => button.addEventListener("click", () => { document.querySelectorAll(".nav-button").forEach((item) => item.classList.toggle("is-active", item === button)); document.querySelectorAll(".view").forEach((view) => view.classList.toggle("is-active", view.id === button.dataset.view)); if (button.dataset.view === "history") renderHistory(); }));
$("#clear-history").addEventListener("click", () => { if (confirm("Clear all practice history stored in this browser?")) { localStorage.removeItem(HISTORY_KEY); renderHistory(); } }); renderHistory();
$("#tile-set").value = tileSet;
$("#tile-set").addEventListener("change", (event) => { tileSet = event.target.value; localStorage.setItem(TILE_SET_KEY, tileSet); renderStarterPreviews(); if (!$("#game").classList.contains("hidden")) render(); });
renderStarterPreviews();
