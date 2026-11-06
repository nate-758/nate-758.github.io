const gameText = {
  en: {
    challengeEyebrow: "Your challenge",
    connectLabel: "Connect",
    toLabel: "to",
    stepsLabel: "Links",
    instructions: "Choose a figure to connect to the person shown in the current step. We’ll show the source for every verified link.",
    chooseNext: "Who is connected to",
    chooseFigure: "Choose {name}",
    howToPlayEyebrow: "How to play",
    howToPlayOne: "Start with the first historical figure.",
    howToPlayTwo: "Choose another figure with a sourced connection.",
    howToPlayThree: "Keep going until you reach the destination.",
    datasetNote: "Connections are limited to our curated sources. An unlisted link is not necessarily a false one.",
    newChallenge: "New challenge",
    restart: "Restart this challenge",
    linkConfirmed: "Verified connection: {type}.",
    sourceLabel: "Sources",
    reachedGoal: "You reached {name} in {count} {linkWord}!",
    scoreAwarded: "Score: {score} points.",
    scoreRule: "Shortest route: 100 points. Subtract 20 points for each extra link.",
    saveError: "Your score could not be saved on this device.",
    linkWord: "link",
    linksWord: "links",
    notInDataset: "We don’t have a verified connection between {first} and {second} in this dataset. That doesn’t mean no historical connection exists.",
    noChallenge: "There are no connected figure pairs requiring an intermediate step in the current dataset.",
    loadError: "The historical data could not be loaded. Please try again later.",
    pathLabel: "Your path"
  },
  fr: {
    challengeEyebrow: "Votre défi",
    connectLabel: "Reliez",
    toLabel: "à",
    stepsLabel: "Liens",
    instructions: "Choisissez un personnage lié à celui de l’étape actuelle. Chaque lien vérifié sera accompagné de sa source.",
    chooseNext: "Qui est lié à",
    chooseFigure: "Choisir {name}",
    howToPlayEyebrow: "Règles du jeu",
    howToPlayOne: "Commencez par le premier personnage historique.",
    howToPlayTwo: "Choisissez un autre personnage avec un lien documenté.",
    howToPlayThree: "Continuez jusqu’à atteindre la destination.",
    datasetNote: "Les liens proposés proviennent de nos sources sélectionnées. Un lien absent des données n’est pas nécessairement faux.",
    newChallenge: "Nouveau défi",
    restart: "Recommencer ce défi",
    linkConfirmed: "Lien vérifié : {type}.",
    sourceLabel: "Sources",
    reachedGoal: "Vous avez rejoint {name} en {count} {linkWord} !",
    scoreAwarded: "Score : {score} points.",
    scoreRule: "Parcours le plus court : 100 points. Chaque lien supplémentaire retire 20 points.",
    saveError: "Votre score n’a pas pu être enregistré sur cet appareil.",
    linkWord: "lien",
    linksWord: "liens",
    notInDataset: "Aucun lien vérifié entre {first} et {second} dans ces données. Cela ne signifie pas qu’il n’existe aucun lien historique.",
    noChallenge: "Aucune paire de personnages nécessitant une étape intermédiaire n’est disponible dans les données actuelles.",
    loadError: "Les données historiques n’ont pas pu être chargées. Veuillez réessayer plus tard.",
    pathLabel: "Votre parcours"
  }
};

const startPerson = document.querySelector("#start-person");
const targetPerson = document.querySelector("#target-person");
const currentPerson = document.querySelector("#current-person");
const pathTrack = document.querySelector("#path-track");
const figureChoices = document.querySelector("#figure-choices");
const stepCount = document.querySelector("#step-count");
const feedback = document.querySelector("#game-feedback");
const newChallengeButton = document.querySelector("#new-challenge");
const restartChallengeButton = document.querySelector("#restart-challenge");

let connectionData;
let currentChallenge;
let currentPath = [];
let currentLanguage = document.documentElement.lang === "fr" ? "fr" : "en";
let feedbackState = null;

function translate(key, replacements = {}) {
  let text = gameText[currentLanguage][key];
  for (const [placeholder, value] of Object.entries(replacements)) {
    text = text.replace(`{${placeholder}}`, value);
  }
  return text;
}

function figureName(id) {
  const figure = connectionData.figures.find((entry) => entry.id === id);
  return figure ? figure.name[currentLanguage] : id;
}

function relationshipBetween(firstId, secondId) {
  return connectionData.relationships.find((relationship) =>
    (relationship.from === firstId && relationship.to === secondId)
    || (relationship.from === secondId && relationship.to === firstId)
  );
}

function shortestDistance(startId, targetId) {
  const queue = [[startId, 0]];
  const visited = new Set([startId]);

  while (queue.length) {
    const [figureId, distance] = queue.shift();
    if (figureId === targetId) {
      return distance;
    }

    connectionData.relationships.forEach((relationship) => {
      let neighbor;
      if (relationship.from === figureId) {
        neighbor = relationship.to;
      } else if (relationship.to === figureId) {
        neighbor = relationship.from;
      }

      if (neighbor && !visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, distance + 1]);
      }
    });
  }

  return Infinity;
}

function chooseChallenge() {
  const candidates = [];
  connectionData.figures.forEach((start, startIndex) => {
    connectionData.figures.slice(startIndex + 1).forEach((target) => {
      const distance = shortestDistance(start.id, target.id);
      if (distance > 1 && Number.isFinite(distance)) {
        candidates.push([start.id, target.id]);
      }
    });
  });

  if (!candidates.length) {
    feedback.textContent = translate("noChallenge");
    newChallengeButton.disabled = true;
    restartChallengeButton.disabled = true;
    return;
  }

  const [startId, targetId] = candidates[Math.floor(Math.random() * candidates.length)];
  currentChallenge = {
    startId,
    targetId,
    shortestLinks: shortestDistance(startId, targetId),
    completed: false
  };
  currentPath = [startId];
  feedbackState = null;
  feedback.replaceChildren();
  newChallengeButton.disabled = false;
  restartChallengeButton.disabled = false;
  renderChallenge();
}

function renderPath() {
  pathTrack.replaceChildren();
  const label = document.createElement("span");
  label.className = "path-label";
  label.textContent = `${translate("pathLabel")}:`;
  pathTrack.append(label);

  currentPath.forEach((figureId, index) => {
    if (index > 0) {
      const arrow = document.createElement("span");
      arrow.className = "path-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "→";
      pathTrack.append(arrow);
    }
    const step = document.createElement("span");
    step.className = "path-step";
    step.textContent = figureName(figureId);
    pathTrack.append(step);
  });
}

function renderChoices() {
  const activeFigure = currentPath[currentPath.length - 1];
  const visited = new Set(currentPath);
  currentPerson.textContent = figureName(activeFigure);
  figureChoices.replaceChildren();

  connectionData.figures.forEach((figure) => {
    if (visited.has(figure.id)) {
      return;
    }

    const button = document.createElement("button");
    button.className = "figure-choice";
    button.type = "button";
    button.textContent = figure.name[currentLanguage];
    button.setAttribute("aria-label", translate("chooseFigure", { name: figure.name[currentLanguage] }));
    button.addEventListener("click", () => selectFigure(figure.id));
    figureChoices.append(button);
  });
}

function renderChallenge() {
  if (!currentChallenge) {
    return;
  }

  const activeFigure = currentPath[currentPath.length - 1];
  startPerson.textContent = figureName(currentChallenge.startId);
  targetPerson.textContent = figureName(currentChallenge.targetId);
  stepCount.textContent = String(currentPath.length - 1);
  renderPath();
  renderChoices();

  if (activeFigure === currentChallenge.targetId || currentChallenge.completed) {
    figureChoices.replaceChildren();
  }

  renderFeedback();
}

function renderFeedback() {
  if (!feedbackState) {
    feedback.replaceChildren();
    return;
  }

  if (feedbackState.kind === "invalid") {
    feedback.textContent = translate("notInDataset", {
      first: figureName(feedbackState.first),
      second: figureName(feedbackState.second)
    });
    return;
  }

  const { relationship, completed, score, saved } = feedbackState;
  const sourceIds = new Set(relationship.sources);
  const sources = connectionData.sources.filter((source) => sourceIds.has(source.id));
  const card = document.createElement("div");
  card.className = "relationship-reveal";

  if (completed) {
    const linkCount = currentPath.length - 1;
    const result = document.createElement("p");
    result.className = "game-result";
    result.textContent = `${translate("reachedGoal", {
      name: figureName(currentChallenge.targetId),
      count: String(linkCount),
      linkWord: linkCount === 1 ? translate("linkWord") : translate("linksWord")
    })} ${translate("scoreAwarded", { score: String(score) })}`;
    card.append(result);

    const rule = document.createElement("p");
    rule.className = "score-rule";
    rule.textContent = translate("scoreRule");
    card.append(rule);

    if (!saved) {
      const saveError = document.createElement("p");
      saveError.className = "score-save-error";
      saveError.textContent = translate("saveError");
      card.append(saveError);
    }
  }

  const title = document.createElement("strong");
  title.textContent = translate("linkConfirmed", { type: relationship.type[currentLanguage] });
  card.append(title);

  const description = document.createElement("p");
  description.textContent = relationship.description[currentLanguage];
  card.append(description);

  const sourceLabel = document.createElement("span");
  sourceLabel.className = "source-label";
  sourceLabel.textContent = `${translate("sourceLabel")}:`;
  card.append(sourceLabel);

  const sourceList = document.createElement("ul");
  sources.forEach((source) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `${source.organization} — ${source.title[currentLanguage]}`;
    item.append(link);
    sourceList.append(item);
  });
  card.append(sourceList);
  feedback.replaceChildren(card);
}

function selectFigure(figureId) {
  if (currentChallenge.completed) {
    return;
  }

  const activeFigure = currentPath[currentPath.length - 1];
  const relationship = relationshipBetween(activeFigure, figureId);

  if (!relationship) {
    feedbackState = { kind: "invalid", first: activeFigure, second: figureId };
    renderFeedback();
    return;
  }

  currentPath.push(figureId);
  const completed = figureId === currentChallenge.targetId;
  let score;
  let saved = true;
  if (completed) {
    currentChallenge.completed = true;
    const linkCount = currentPath.length - 1;
    score = Math.max(0, 100 - 20 * (linkCount - currentChallenge.shortestLinks));
    try {
      window.ChronoGameStats.recordHistoricalConnections({
        score,
        links: linkCount,
        shortestLinks: currentChallenge.shortestLinks,
        startId: currentChallenge.startId,
        targetId: currentChallenge.targetId
      });
    } catch (error) {
      saved = false;
      console.error("Could not save the completed Historical Connections game.", error);
    }
  }
  feedbackState = {
    kind: "relationship",
    relationship,
    completed,
    score,
    saved
  };
  renderChallenge();
}

function restartChallenge() {
  if (!currentChallenge) {
    return;
  }
  currentPath = [currentChallenge.startId];
  currentChallenge.completed = false;
  feedbackState = null;
  feedback.replaceChildren();
  renderChallenge();
}

function applyGameLanguage() {
  document.querySelectorAll("[data-game-i18n]").forEach((element) => {
    element.textContent = translate(element.dataset.gameI18n);
  });

  pathTrack.setAttribute("aria-label", translate("pathLabel"));
  figureChoices.setAttribute("aria-label", translate("chooseNext"));
  if (currentChallenge) {
    renderChallenge();
  } else if (connectionData) {
    renderFeedback();
  }

}

async function loadConnectionData() {
  try {
    const response = await fetch("../data/historical-connections.json");
    if (!response.ok) {
      throw new Error(`Historical data request failed: ${response.status}`);
    }
    connectionData = await response.json();
    if (!Array.isArray(connectionData.figures) || !Array.isArray(connectionData.relationships) || !Array.isArray(connectionData.sources)) {
      throw new Error("Historical data has an invalid structure.");
    }
    const figureIds = new Set(connectionData.figures.map((figure) => figure.id));
    const sourceIds = new Set(connectionData.sources.map((source) => source.id));
    const invalidFigure = figureIds.size !== connectionData.figures.length
      || connectionData.figures.some((figure) => !figure.id || !figure.name?.en || !figure.name?.fr);
    const invalidRelationship = connectionData.relationships.some((relationship) =>
      !figureIds.has(relationship.from)
      || !figureIds.has(relationship.to)
      || !relationship.type?.en
      || !relationship.type?.fr
      || !relationship.description?.en
      || !relationship.description?.fr
      || !Array.isArray(relationship.sources)
      || relationship.sources.length === 0
      || relationship.sources.some((sourceId) => !sourceIds.has(sourceId))
    );
    const invalidSource = sourceIds.size !== connectionData.sources.length
      || connectionData.sources.some((source) => !source.id || !source.url || !source.title?.en || !source.title?.fr);
    if (invalidFigure || invalidRelationship || invalidSource) {
      throw new Error("Historical data contains missing translations or invalid references.");
    }
    chooseChallenge();
  } catch (error) {
    console.error("Could not initialize Historical Connections.", error);
    feedback.textContent = translate("loadError");
    newChallengeButton.disabled = true;
    restartChallengeButton.disabled = true;
  }
}

newChallengeButton.addEventListener("click", chooseChallenge);
restartChallengeButton.addEventListener("click", restartChallenge);
document.addEventListener("languagechange", (event) => {
  currentLanguage = event.detail.language;
  applyGameLanguage();
});

applyGameLanguage();
loadConnectionData();
