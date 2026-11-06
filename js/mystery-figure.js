const mysteryText = {
  en: {
    challengeEyebrow: "Mystery challenge",
    gameTitle: "Who am I?",
    difficultyLabel: "Difficulty",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    instructions: "Reveal clues one at a time. Earlier correct answers earn more points; each wrong guess costs 1 point.",
    clueLabel: "Clue",
    clueScore: "{score} points available",
    clueScoreSingular: "{score} point available",
    revealClue: "Reveal next clue",
    giveUp: "Show answer",
    guessPrompt: "Choose the historical figure",
    chooseAnswer: "Guess {name}",
    nextChallenge: "Next challenge",
    howToPlayEyebrow: "How to play",
    howToPlayOne: "Read each clue as it appears.",
    howToPlayTwo: "Choose the figure you think it describes.",
    howToPlayThree: "Earn 5 points on clue one, down to 1 point on clue five.",
    howToPlayFour: "Each wrong guess costs 1 point.",
    sourceNote: "Every answer includes a source for further reading.",
    correct: "Correct! You earned {score} points.",
    correctSingular: "Correct! You earned {score} point.",
    incorrect: "Not quite. 1 point deducted; {score} points remain.",
    incorrectSingular: "Not quite. 1 point deducted; {score} point remains.",
    noPointsRemain: "Not quite. 1 point deducted; no points remain.",
    gaveUp: "The answer was {name}. You earned 0 points.",
    answerLabel: "The historical figure was {name}.",
    learnMore: "Learn more",
    sourceLabel: "Source",
    loadingError: "Mystery figures could not be loaded. Please try again later.",
    noFigures: "There are no figures for this difficulty yet.",
    saveError: "Your result could not be saved on this device."
  },
  fr: {
    challengeEyebrow: "Personnage mystère",
    gameTitle: "Qui suis-je ?",
    difficultyLabel: "Difficulté",
    easy: "Facile",
    medium: "Moyen",
    hard: "Difficile",
    instructions: "Révélez les indices un à un. Une bonne réponse donnée tôt rapporte plus de points ; chaque mauvaise réponse coûte 1 point.",
    clueLabel: "Indice",
    clueScore: "{score} points possibles",
    clueScoreSingular: "{score} point possible",
    revealClue: "Révéler l’indice suivant",
    giveUp: "Voir la réponse",
    guessPrompt: "Choisissez le personnage historique",
    chooseAnswer: "Réponse : {name}",
    nextChallenge: "Défi suivant",
    howToPlayEyebrow: "Règles du jeu",
    howToPlayOne: "Lisez chaque indice au fur et à mesure.",
    howToPlayTwo: "Choisissez le personnage auquel les indices font penser.",
    howToPlayThree: "Gagnez 5 points au premier indice, jusqu’à 1 point au cinquième.",
    howToPlayFour: "Chaque mauvaise réponse coûte 1 point.",
    sourceNote: "Chaque réponse propose une source pour aller plus loin.",
    correct: "Bonne réponse ! Vous gagnez {score} points.",
    correctSingular: "Bonne réponse ! Vous gagnez {score} point.",
    incorrect: "Pas tout à fait. 1 point en moins ; il vous reste {score} points.",
    incorrectSingular: "Pas tout à fait. 1 point en moins ; il vous reste {score} point.",
    noPointsRemain: "Pas tout à fait. 1 point en moins ; il ne vous reste aucun point.",
    gaveUp: "La réponse était {name}. Vous gagnez 0 point.",
    answerLabel: "Le personnage historique était {name}.",
    learnMore: "En savoir plus",
    sourceLabel: "Source",
    loadingError: "Les personnages mystères n’ont pas pu être chargés. Veuillez réessayer plus tard.",
    noFigures: "Aucun personnage n’est encore proposé à cette difficulté.",
    saveError: "Votre résultat n’a pas pu être enregistré sur cet appareil."
  }
};

const difficultySelect = document.querySelector("#difficulty-select");
const clueCount = document.querySelector("#clue-count");
const clueScore = document.querySelector("#clue-score");
const clueList = document.querySelector("#clue-list");
const revealClueButton = document.querySelector("#reveal-clue");
const giveUpButton = document.querySelector("#give-up");
const guessOptions = document.querySelector("#guess-options");
const feedback = document.querySelector("#mystery-feedback");
const nextChallengeButton = document.querySelector("#next-mystery");

let mysteryData;
let currentFigure;
let clueIndex = 0;
let currentLanguage = document.documentElement.lang === "fr" ? "fr" : "en";
let completedResult;
let feedbackKey = "";
let lastFigureIdByDifficulty = {};
let incorrectGuesses = new Set();
let saveFailed = false;

function translateMystery(key, replacements = {}) {
  let text = mysteryText[currentLanguage][key];
  for (const [placeholder, value] of Object.entries(replacements)) {
    text = text.replace(`{${placeholder}}`, value);
  }
  return text;
}

function chooseFigure() {
  const difficulty = difficultySelect.value;
  const candidates = mysteryData.figures.filter((figure) => figure.difficulty === difficulty);
  if (!candidates.length) {
    currentFigure = null;
    feedbackKey = "noFigures";
    renderChallenge();
    return;
  }

  const previousFigureId = lastFigureIdByDifficulty[difficulty];
  const available = candidates.length > 1
    ? candidates.filter((figure) => figure.id !== previousFigureId)
    : candidates;
  currentFigure = available[Math.floor(Math.random() * available.length)];
  lastFigureIdByDifficulty[difficulty] = currentFigure.id;
  clueIndex = 0;
  completedResult = null;
  incorrectGuesses = new Set();
  saveFailed = false;
  feedbackKey = "";
  clueList.replaceChildren();
  feedback.replaceChildren();
  nextChallengeButton.disabled = true;
  revealClueButton.disabled = false;
  giveUpButton.disabled = false;
  renderOptions();
  revealNextClue();
}

function renderOptions() {
  guessOptions.replaceChildren();
  if (!currentFigure || completedResult) {
    return;
  }

  const options = mysteryData.figures.slice();
  for (let index = options.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [options[index], options[swapIndex]] = [options[swapIndex], options[index]];
  }

  options.forEach((figure) => {
    const button = document.createElement("button");
    button.className = "figure-choice";
    button.type = "button";
    button.textContent = figure.name[currentLanguage];
    button.setAttribute("aria-label", translateMystery("chooseAnswer", { name: figure.name[currentLanguage] }));
    button.disabled = incorrectGuesses.has(figure.id);
    button.addEventListener("click", () => submitGuess(figure.id, button));
    guessOptions.append(button);
  });
}

function revealNextClue() {
  if (!currentFigure || completedResult || clueIndex >= currentFigure.clues.length) {
    return;
  }

  const item = document.createElement("li");
  item.className = "clue-item";
  const number = document.createElement("span");
  number.className = "clue-number";
  number.textContent = String(clueIndex + 1).padStart(2, "0");
  const text = document.createElement("span");
  text.textContent = currentFigure.clues[clueIndex][currentLanguage];
  item.append(number, text);
  clueList.append(item);
  clueIndex += 1;
  renderProgress();
  if (feedbackKey === "incorrect" || feedbackKey === "incorrectSingular" || feedbackKey === "noPointsRemain") {
    feedbackKey = getIncorrectFeedbackKey();
    renderFeedback();
  }

  if (clueIndex >= currentFigure.clues.length) {
    revealClueButton.disabled = true;
  }
}

function renderProgress() {
  clueCount.textContent = `${clueIndex} / ${currentFigure ? currentFigure.clues.length : 5}`;
  if (clueIndex === 0 || completedResult) {
    clueScore.textContent = "";
    return;
  }

  const score = getAvailableScore();
  const scoreKey = score === 1 ? "clueScoreSingular" : "clueScore";
  clueScore.textContent = translateMystery(scoreKey, { score: String(score) });
}

function getAvailableScore() {
  return Math.max(0, 6 - clueIndex - incorrectGuesses.size);
}

function getIncorrectFeedbackKey() {
  const score = getAvailableScore();
  if (score === 0) {
    return "noPointsRemain";
  }
  return score === 1 ? "incorrectSingular" : "incorrect";
}

function renderClues() {
  clueList.replaceChildren();
  if (!currentFigure) {
    return;
  }

  currentFigure.clues.slice(0, clueIndex).forEach((clue, index) => {
    const item = document.createElement("li");
    item.className = "clue-item";
    const number = document.createElement("span");
    number.className = "clue-number";
    number.textContent = String(index + 1).padStart(2, "0");
    const text = document.createElement("span");
    text.textContent = clue[currentLanguage];
    item.append(number, text);
    clueList.append(item);
  });
}

function renderFeedback() {
  feedback.replaceChildren();
  if (feedbackKey) {
    feedback.textContent = translateMystery(feedbackKey, {
      name: currentFigure?.name[currentLanguage] || "",
      score: String(completedResult ? completedResult.score : getAvailableScore())
    });
  }

  if (!completedResult || !currentFigure) {
    return;
  }

  if (saveFailed) {
    const warning = document.createElement("p");
    warning.className = "score-save-error";
    warning.textContent = translateMystery("saveError");
    feedback.append(warning);
  }

  const answer = document.createElement("p");
  answer.className = "game-result";
  answer.textContent = translateMystery("answerLabel", { name: currentFigure.name[currentLanguage] });
  feedback.append(answer);

  const summary = document.createElement("p");
  summary.className = "mystery-summary";
  summary.textContent = currentFigure.summary[currentLanguage];
  feedback.append(summary);

  const sourceIds = new Set(currentFigure.sources);
  const source = mysteryData.sources.find((entry) => sourceIds.has(entry.id));
  if (source) {
    const link = document.createElement("a");
    link.className = "mystery-source";
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `${translateMystery("learnMore")}: ${source.organization} — ${source.title[currentLanguage]}`;
    feedback.append(link);
  }
}

function completeChallenge(score, answerShown) {
  if (completedResult || !currentFigure) {
    return;
  }

  completedResult = { score, answerShown };
  feedbackKey = answerShown ? "gaveUp" : score === 1 ? "correctSingular" : "correct";
  saveFailed = false;
  revealClueButton.disabled = true;
  giveUpButton.disabled = true;
  nextChallengeButton.disabled = false;
  guessOptions.querySelectorAll(".figure-choice").forEach((button) => {
    button.disabled = true;
  });
  renderProgress();

  try {
    window.ChronoGameStats.recordMysteryFigure({
      score,
      figureId: currentFigure.id,
      difficulty: currentFigure.difficulty,
      cluesUsed: clueIndex
    });
  } catch (error) {
    console.error("Could not save the completed Mystery Figure game.", error);
    saveFailed = true;
  }
  renderFeedback();
}

function submitGuess(figureId, button) {
  if (completedResult || !currentFigure) {
    return;
  }

  if (figureId === currentFigure.id) {
    completeChallenge(getAvailableScore(), false);
    return;
  }

  incorrectGuesses.add(figureId);
  button.disabled = true;
  feedbackKey = getIncorrectFeedbackKey();
  renderProgress();
  renderFeedback();
}

function renderChallenge() {
  document.querySelectorAll("[data-game-i18n]").forEach((element) => {
    element.textContent = translateMystery(element.dataset.gameI18n);
  });
  guessOptions.setAttribute("aria-label", translateMystery("guessPrompt"));
  renderClues();
  renderProgress();
  renderOptions();
  renderFeedback();
}

async function loadMysteryData() {
  try {
    const response = await fetch("../data/mystery-figures.json");
    if (!response.ok) {
      throw new Error(`Mystery figure data request failed: ${response.status}`);
    }

    mysteryData = await response.json();
    if (!Array.isArray(mysteryData.figures) || mysteryData.figures.length < 2 || !Array.isArray(mysteryData.sources)) {
      throw new Error("Mystery figure data has an invalid structure.");
    }

    const sourceIds = new Set(mysteryData.sources.map((source) => source.id));
    const invalidFigure = mysteryData.figures.some((figure) =>
      !figure.id
      || !figure.name?.en
      || !figure.name?.fr
      || !["easy", "medium", "hard"].includes(figure.difficulty)
      || !Array.isArray(figure.clues)
      || figure.clues.length !== 5
      || figure.clues.some((clue) => !clue.en || !clue.fr)
      || !figure.summary?.en
      || !figure.summary?.fr
      || !Array.isArray(figure.sources)
      || figure.sources.length === 0
      || figure.sources.some((sourceId) => !sourceIds.has(sourceId))
    );
    if (invalidFigure) {
      throw new Error("Mystery figure data contains incomplete or invalid records.");
    }

    chooseFigure();
  } catch (error) {
    console.error("Could not initialize Mystery Figure.", error);
    feedbackKey = "loadingError";
    renderChallenge();
    revealClueButton.disabled = true;
    giveUpButton.disabled = true;
  }
}

revealClueButton.addEventListener("click", revealNextClue);
giveUpButton.addEventListener("click", () => completeChallenge(0, true));
nextChallengeButton.addEventListener("click", chooseFigure);
difficultySelect.addEventListener("change", chooseFigure);
document.addEventListener("languagechange", (event) => {
  currentLanguage = event.detail.language;
  renderChallenge();
});

renderChallenge();
loadMysteryData();
