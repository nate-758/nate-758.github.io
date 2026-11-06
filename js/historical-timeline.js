const timelineText = {
  en: {
    challengeEyebrow: "Timeline challenge",
    gameTitle: "Put the events in order",
    difficultyLabel: "Difficulty",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    instructions: "Arrange the events from earliest to latest. Drag cards or use the arrow buttons, then check your order. Each incorrect check costs 10 points; a correct order earns the points you have left, up to 100.",
    eventsLabel: "Events",
    orderHint: "Earliest to latest",
    submit: "Check my order",
    nextChallenge: "New challenge",
    howToPlayEyebrow: "How to play",
    howToPlayOne: "Put the events in chronological order.",
    howToPlayTwo: "Drag a card or use its up and down buttons.",
    howToPlayThree: "Check how many events are in the right place; finish the order to reveal dates and sources.",
    scoreNote: "The maximum score is 100 points. Each incorrect check costs 10 points; correct checks are never penalized.",
    sourceNote: "Sources are shown with the answers.",
    moveUp: "Move up: {event}",
    moveDown: "Move down: {event}",
    source: "Source",
    pointsLabel: "Points",
    retryIncorrect: "{correct} correct. Try again.",
    correctCount: "{correct} correct",
    tryAgain: "Try again.",
    outOfPoints: "No points left. Revealing the correct timeline…",
    resultPerfect: "Perfect order! {correct} of {total} events are correct. You earned {score} points.",
    loadError: "Timeline events could not be loaded. Please try again later.",
    noEvents: "There are not enough events for this difficulty yet.",
    saveError: "Your result could not be saved on this device."
  },
  fr: {
    challengeEyebrow: "Défi chronologique",
    gameTitle: "Remettez les événements dans l’ordre",
    difficultyLabel: "Difficulté",
    easy: "Facile",
    medium: "Moyen",
    hard: "Difficile",
    instructions: "Classez les événements du plus ancien au plus récent. Faites glisser les cartes ou utilisez les flèches, puis vérifiez l’ordre. Chaque vérification incorrecte coûte 10 points ; un ordre correct rapporte les points restants, jusqu’à 100.",
    eventsLabel: "Événements",
    orderHint: "Du plus ancien au plus récent",
    submit: "Vérifier mon ordre",
    nextChallenge: "Nouveau défi",
    howToPlayEyebrow: "Règles du jeu",
    howToPlayOne: "Classez les événements par ordre chronologique.",
    howToPlayTwo: "Faites glisser une carte ou utilisez ses flèches haut et bas.",
    howToPlayThree: "Vérifiez combien d’événements sont bien placés ; terminez l’ordre pour révéler les dates et les sources.",
    scoreNote: "Le score maximal est de 100 points. Chaque vérification incorrecte coûte 10 points ; les réponses correctes ne sont jamais pénalisées.",
    sourceNote: "Les sources sont affichées avec les réponses.",
    moveUp: "Monter : {event}",
    moveDown: "Descendre : {event}",
    source: "Source",
    pointsLabel: "Points",
    retryIncorrect: "{correct} réponse(s) correcte(s). Réessayez.",
    correctCount: "{correct} réponse(s) correcte(s)",
    tryAgain: "Réessayez.",
    outOfPoints: "Plus de points. Voici la frise dans le bon ordre…",
    resultPerfect: "Ordre parfait ! {correct} événement(s) sur {total} sont corrects. Vous gagnez {score} points.",
    loadError: "Les événements historiques n’ont pas pu être chargés. Veuillez réessayer plus tard.",
    noEvents: "Il n’y a pas encore assez d’événements pour cette difficulté.",
    saveError: "Votre résultat n’a pas pu être enregistré sur cet appareil."
  }
};

const difficultyCounts = { easy: 4, medium: 5, hard: 6 };
const difficultySelect = document.querySelector("#timeline-difficulty");
const eventCount = document.querySelector("#timeline-event-count");
const timelineList = document.querySelector("#timeline-list");
const submitButton = document.querySelector("#timeline-submit");
const nextButton = document.querySelector("#timeline-next");
const feedback = document.querySelector("#timeline-feedback");
const scoreValue = document.querySelector("#timeline-score-value");
const scorePenalty = document.querySelector("#timeline-score-penalty");
const zeroPointsToast = document.querySelector("#timeline-zero-toast");

let currentLanguage = document.documentElement.lang === "fr" ? "fr" : "en";
let eventData;
let currentEvents = [];
let currentOrder = [];
let submitted = false;
let challengeEnding = false;
let hasChecked = false;
let currentScore = 100;
let scoreAnimationFrame;
let zeroPointsTimeout;
let feedbackKey = "";
let feedbackValues = {};
let draggedCard;
let dropTargetCard;
let dropAfterTarget = false;
let saveFailed = false;

function translateTimeline(key, replacements = {}) {
  let text = timelineText[currentLanguage][key];
  for (const [placeholder, value] of Object.entries(replacements)) {
    text = text.replace(`{${placeholder}}`, value);
  }
  return text;
}

function renderStaticText() {
  document.querySelectorAll("[data-timeline-i18n]").forEach((element) => {
    element.textContent = translateTimeline(element.dataset.timelineI18n);
  });
  timelineList.setAttribute("aria-label", translateTimeline("gameTitle"));
  document.querySelector(".timeline-score").setAttribute("aria-label", translateTimeline("pointsLabel"));
}

function animateScore(target, startValue = currentScore) {
  cancelAnimationFrame(scoreAnimationFrame);
  scoreValue.classList.remove("is-counting");
  const start = performance.now();
  const duration = 1000;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  currentScore = target;

  if (prefersReducedMotion || startValue === target) {
    scoreValue.textContent = String(target);
    return;
  }

  scoreValue.textContent = String(startValue);
  scoreValue.classList.add("is-counting");
  function updateScore(now) {
    const progress = Math.min((now - start) / duration, 1);
    const easedProgress = 1 - (1 - progress) ** 3;
    scoreValue.textContent = String(Math.round(startValue + (target - startValue) * easedProgress));
    if (progress < 1) {
      scoreAnimationFrame = requestAnimationFrame(updateScore);
    } else {
      scoreValue.classList.remove("is-counting");
    }
  }
  scoreAnimationFrame = requestAnimationFrame(updateScore);
}

function showScorePenalty(pointsLost) {
  if (!pointsLost) {
    return;
  }
  scorePenalty.textContent = `-${pointsLost}`;
  scorePenalty.classList.remove("is-falling");
  void scorePenalty.offsetWidth;
  scorePenalty.classList.add("is-falling");
}

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function getEventOrder() {
  return Array.from(timelineList.children, (card) => card.dataset.eventId);
}

function moveEvent(eventId, offset) {
  if (submitted || challengeEnding) {
    return;
  }
  const index = currentOrder.findIndex((event) => event.id === eventId);
  const nextIndex = index + offset;
  if (index < 0 || nextIndex < 0 || nextIndex >= currentOrder.length) {
    return;
  }
  const clearCheckResult = hasChecked;
  [currentOrder[index], currentOrder[nextIndex]] = [currentOrder[nextIndex], currentOrder[index]];
  if (clearCheckResult) {
    hasChecked = false;
    feedbackKey = "";
    feedbackValues = {};
  }
  renderEvents();
  if (clearCheckResult) {
    renderFeedback("");
  }
  timelineList.querySelector(`[data-event-id="${eventId}"] [data-action="move-${offset < 0 ? "up" : "down"}"]`)?.focus();
}

function createEventCard(event, index) {
  const card = document.createElement("li");
  card.className = "timeline-card";
  card.dataset.eventId = event.id;
  card.draggable = !submitted && !challengeEnding;

  const position = document.createElement("span");
  position.className = "timeline-position";
  position.textContent = String(index + 1).padStart(2, "0");

  const content = document.createElement("div");
  content.className = "timeline-event-content";
  const title = document.createElement("p");
  title.className = "timeline-event-title";
  title.textContent = event.title[currentLanguage];
  content.append(title);

  if (submitted) {
    const date = document.createElement("p");
    date.className = "timeline-event-date";
    date.textContent = event.date[currentLanguage];

    const source = document.createElement("a");
    source.className = "timeline-source";
    source.href = event.source[currentLanguage].url;
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    source.textContent = `${translateTimeline("source")}: ${event.source[currentLanguage].title}`;
    content.append(date, source);
  }

  card.append(position, content);

  if (!submitted && !challengeEnding) {
    const controls = document.createElement("div");
    controls.className = "timeline-card-controls";
    const upButton = document.createElement("button");
    upButton.className = "timeline-move-button";
    upButton.type = "button";
    upButton.dataset.action = "move-up";
    upButton.dataset.eventId = event.id;
    upButton.setAttribute("aria-label", translateTimeline("moveUp", { event: event.title[currentLanguage] }));
    upButton.textContent = "↑";
    upButton.disabled = index === 0;

    const downButton = document.createElement("button");
    downButton.className = "timeline-move-button";
    downButton.type = "button";
    downButton.dataset.action = "move-down";
    downButton.dataset.eventId = event.id;
    downButton.setAttribute("aria-label", translateTimeline("moveDown", { event: event.title[currentLanguage] }));
    downButton.textContent = "↓";
    downButton.disabled = index === currentOrder.length - 1;
    controls.append(upButton, downButton);
    card.append(controls);
  }

  return card;
}

function renderEvents() {
  const eventsById = new Map(currentEvents.map((event) => [event.id, event]));
  const fragment = document.createDocumentFragment();
  currentOrder.forEach((event) => {
    const cardEvent = eventsById.get(event.id);
    if (cardEvent) {
      fragment.append(createEventCard(cardEvent, fragment.childElementCount));
    }
  });
  timelineList.replaceChildren(fragment);
  eventCount.textContent = String(currentOrder.length);
  submitButton.disabled = submitted || challengeEnding || currentOrder.length === 0;
  nextButton.disabled = !submitted || currentOrder.length === 0;
}

function renderFeedback(message) {
  feedback.replaceChildren();
  feedback.parentElement.classList.toggle("has-feedback", Boolean(message) || saveFailed);
  const isIncorrectAttempt = feedbackKey === "retryIncorrect";
  const hasCorrectPositions = Number(feedbackValues.correct) > 0;
  feedback.classList.toggle("is-incorrect", isIncorrectAttempt && !hasCorrectPositions);
  feedback.classList.toggle("is-correct", feedbackKey === "resultPerfect" || (isIncorrectAttempt && hasCorrectPositions));
  if (message) {
    if (feedbackKey === "retryIncorrect") {
      const count = document.createElement("strong");
      count.className = "timeline-correct-count";
      count.textContent = translateTimeline("correctCount", feedbackValues);
      const retry = document.createElement("span");
      retry.textContent = translateTimeline("tryAgain");
      feedback.append(count, retry);
    } else {
      const text = document.createElement("span");
      text.textContent = message;
      feedback.append(text);
    }
  }
  if (saveFailed) {
    const warning = document.createElement("span");
    warning.className = "score-save-error";
    warning.textContent = translateTimeline("saveError");
    feedback.append(warning);
  }
}

function recordTimelineResult(correctPositions) {
  try {
    window.ChronoGameStats.recordHistoricalTimeline({
      score: currentScore,
      correctPositions,
      totalEvents: currentOrder.length,
      difficulty: difficultySelect.value
    });
  } catch (error) {
    console.error("Could not save the completed Historical Timeline.", error);
    saveFailed = true;
    renderFeedback(translateTimeline(feedbackKey, feedbackValues));
  }
}

function revealCorrectTimeline(correctPositions) {
  currentOrder = [...currentEvents].sort((first, second) => first.year - second.year);
  challengeEnding = false;
  submitted = true;
  zeroPointsToast.hidden = true;
  feedbackKey = "";
  feedbackValues = {};
  renderEvents();
  renderFeedback("");
  recordTimelineResult(correctPositions);
}

function endChallengeAtZero(correctPositions) {
  challengeEnding = true;
  feedbackKey = "";
  feedbackValues = {};
  zeroPointsToast.hidden = false;
  zeroPointsToast.classList.remove("is-visible");
  void zeroPointsToast.offsetWidth;
  zeroPointsToast.classList.add("is-visible");
  renderEvents();
  renderFeedback("");
  zeroPointsTimeout = window.setTimeout(() => {
    zeroPointsToast.classList.remove("is-visible");
    revealCorrectTimeline(correctPositions);
  }, 1600);
}

function createChallenge() {
  if (!eventData) {
    return;
  }
  window.clearTimeout(zeroPointsTimeout);
  challengeEnding = false;
  zeroPointsToast.hidden = true;
  zeroPointsToast.classList.remove("is-visible");
  const difficulty = difficultySelect.value;
  const candidates = eventData.events.filter((event) => event.difficulty === difficulty);
  const count = difficultyCounts[difficulty];
  if (candidates.length < count) {
    currentEvents = [];
    currentOrder = [];
    submitted = false;
    hasChecked = false;
    saveFailed = false;
    feedbackKey = "";
    feedbackValues = {};
    animateScore(100);
    renderEvents();
    renderFeedback(translateTimeline("noEvents"));
    return;
  }

  currentEvents = shuffle(candidates).slice(0, count).sort((first, second) => first.year - second.year);
  currentOrder = shuffle(currentEvents);
  if (currentOrder.every((event, index) => event.id === currentEvents[index].id)) {
    currentOrder.push(currentOrder.shift());
  }
  submitted = false;
  hasChecked = false;
  saveFailed = false;
  feedbackKey = "";
  feedbackValues = {};
  animateScore(100);
  renderEvents();
  renderFeedback("");
}

function validateEventData(data) {
  const validDifficulties = new Set(["easy", "medium", "hard"]);
  if (!Array.isArray(data?.events) || data.events.length === 0) {
    return false;
  }
  const eventIds = new Set();
  const eventsAreValid = data.events.every((event) => {
    if (eventIds.has(event.id)) {
      return false;
    }
    eventIds.add(event.id);
    return (
      typeof event.id === "string"
      && validDifficulties.has(event.difficulty)
      && Number.isInteger(event.year)
      && ["en", "fr"].every((language) =>
        typeof event.title?.[language] === "string"
        && typeof event.date?.[language] === "string"
        && typeof event.source?.[language]?.title === "string"
        && /^https:\/\//.test(event.source?.[language]?.url || "")
      )
    );
  });
  return eventsAreValid
    && ["easy", "medium", "hard"].every((difficulty) =>
      data.events.filter((event) => event.difficulty === difficulty).length >= difficultyCounts[difficulty]
    );
}

function submitTimeline() {
  if (submitted || challengeEnding || !currentOrder.length) {
    return;
  }
  const correctEvents = [...currentEvents].sort((first, second) => first.year - second.year);
  const correctPositions = currentOrder.reduce((count, event, index) =>
    count + Number(event.id === correctEvents[index].id), 0);
  if (correctPositions === currentOrder.length) {
    submitted = true;
    const score = currentScore;
    feedbackKey = "resultPerfect";
    feedbackValues = {
      correct: String(correctPositions),
      total: String(currentOrder.length),
      score: String(score)
    };
    scoreValue.classList.remove("is-awarded");
    void scoreValue.offsetWidth;
    scoreValue.classList.add("is-awarded");
    renderEvents();
    renderFeedback(translateTimeline(feedbackKey, feedbackValues));
    recordTimelineResult(correctPositions);
    return;
  } else {
    const pointsLost = Math.min(10, currentScore);
    animateScore(currentScore - pointsLost);
    showScorePenalty(pointsLost);
    hasChecked = true;
    feedbackKey = "retryIncorrect";
    feedbackValues = {
      correct: String(correctPositions)
    };
    if (currentScore === 0) {
      endChallengeAtZero(correctPositions);
      return;
    }
  }
  renderEvents();
  renderFeedback(translateTimeline(feedbackKey, feedbackValues));
}

timelineList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button || submitted || challengeEnding) {
    return;
  }
  moveEvent(button.dataset.eventId, button.dataset.action === "move-up" ? -1 : 1);
});

timelineList.addEventListener("dragstart", (event) => {
  const card = event.target.closest(".timeline-card");
  if (!card || submitted || challengeEnding || event.target.closest("button")) {
    event.preventDefault();
    return;
  }
  draggedCard = card;
  card.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", card.dataset.eventId);
});

timelineList.addEventListener("dragover", (event) => {
  if (!draggedCard || submitted || challengeEnding) {
    return;
  }
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  const targetCard = event.target.closest(".timeline-card");
  if (!targetCard || draggedCard === targetCard) {
    return;
  }
  dropTargetCard?.classList.remove("is-drop-target");
  dropTargetCard = targetCard;
  dropTargetCard.classList.add("is-drop-target");
  const bounds = targetCard.getBoundingClientRect();
  dropAfterTarget = event.clientY > bounds.top + bounds.height / 2;
});

timelineList.addEventListener("drop", (event) => {
  if (!draggedCard || submitted || challengeEnding) {
    return;
  }
  event.preventDefault();
  const targetCard = event.target.closest(".timeline-card") || dropTargetCard;
  if (targetCard && targetCard !== draggedCard) {
    const bounds = targetCard.getBoundingClientRect();
    const insertAfter = event.target.closest(".timeline-card")
      ? event.clientY > bounds.top + bounds.height / 2
      : dropAfterTarget;
    timelineList.insertBefore(draggedCard, insertAfter ? targetCard.nextSibling : targetCard);
    currentOrder = getEventOrder().map((id) => currentEvents.find((item) => item.id === id));
    const clearCheckResult = hasChecked;
    if (clearCheckResult) {
      hasChecked = false;
      feedbackKey = "";
      feedbackValues = {};
    }
    renderEvents();
    if (clearCheckResult) {
      renderFeedback("");
    }
  }
  dropTargetCard?.classList.remove("is-drop-target");
  draggedCard = null;
  dropTargetCard = null;
});

timelineList.addEventListener("dragend", () => {
  draggedCard?.classList.remove("is-dragging");
  dropTargetCard?.classList.remove("is-drop-target");
  draggedCard = null;
  dropTargetCard = null;
});

submitButton.addEventListener("click", submitTimeline);
nextButton.addEventListener("click", createChallenge);
difficultySelect.addEventListener("change", createChallenge);

document.addEventListener("languagechange", (event) => {
  currentLanguage = event.detail.language;
  renderStaticText();
  renderEvents();
  if (challengeEnding) {
    zeroPointsToast.textContent = translateTimeline("outOfPoints");
  }
  if (submitted) {
    renderFeedback(translateTimeline(feedbackKey, feedbackValues));
  } else if (feedbackKey) {
    renderFeedback(translateTimeline(feedbackKey, feedbackValues));
  }
});

try {
  eventData = window.ChronoHistoricalTimeline;
  if (!validateEventData(eventData)) {
    throw new Error("Timeline event data has an invalid structure.");
  }
  renderStaticText();
  createChallenge();
} catch (error) {
  console.error("Could not initialize Historical Timeline.", error);
  renderStaticText();
  currentEvents = [];
  currentOrder = [];
  submitted = false;
  hasChecked = false;
  renderEvents();
  renderFeedback(translateTimeline("loadError"));
}
