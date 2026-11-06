const statisticsText = {
  en: {
    connectionsTitle: "Historical Connections",
    connectionsPlayed: "Games played",
    connectionsBest: "Personal best",
    connectionsRecent: "Recent results",
    connectionsEmpty: "Complete a Historical Connections challenge to see your results here.",
    mysteryTitle: "Mystery Figure",
    mysteryPlayed: "Games played",
    mysteryBest: "Personal best",
    mysteryRecent: "Recent results",
    mysteryEmpty: "Complete a Mystery Figure challenge to see your results here.",
    raceTitle: "Wikipedia Race",
    racePlayed: "Games played",
    raceBest: "Personal best",
    raceRecent: "Recent results",
    raceEmpty: "Finish a Wikipedia Race to see your results here.",
    timelineTitle: "Historical Timeline",
    timelinePlayed: "Games played",
    timelineBest: "Personal best",
    timelineRecent: "Recent results",
    timelineEmpty: "Complete a Historical Timeline challenge to see your results here.",
    pointsUnit: "points",
    score: "{score} points",
    route: "{start} to {target}",
    links: "{count} links (shortest: {shortest})",
    mysteryResult: "{difficulty} · {clues} clues",
    raceRoute: "{start} to {target}",
    raceResult: "{clicks} clicks",
    raceResultSingular: "{clicks} click",
    timelineResult: "{correct} of {total} events · {difficulty}",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    date: "{date}",
    figureLoadError: "Some figure names could not be loaded. Figure IDs may be shown instead.",
    storageUnavailable: "Statistics could not be read from this browser.",
    storageInvalid: "Saved statistics could not be understood. Complete another game to begin a new record."
  },
  fr: {
    connectionsTitle: "Liens historiques",
    connectionsPlayed: "Parties jouées",
    connectionsBest: "Meilleur score",
    connectionsRecent: "Résultats récents",
    connectionsEmpty: "Terminez un défi Liens historiques pour afficher vos résultats ici.",
    mysteryTitle: "Personnage mystère",
    mysteryPlayed: "Parties jouées",
    mysteryBest: "Meilleur score",
    mysteryRecent: "Résultats récents",
    mysteryEmpty: "Terminez un défi Personnage mystère pour afficher vos résultats ici.",
    raceTitle: "Course Wikipédia",
    racePlayed: "Parties jouées",
    raceBest: "Meilleur score",
    raceRecent: "Résultats récents",
    raceEmpty: "Terminez une Course Wikipédia pour afficher vos résultats ici.",
    timelineTitle: "Frise historique",
    timelinePlayed: "Parties jouées",
    timelineBest: "Meilleur score",
    timelineRecent: "Résultats récents",
    timelineEmpty: "Terminez un défi Frise historique pour afficher vos résultats ici.",
    pointsUnit: "points",
    score: "{score} points",
    route: "{start} vers {target}",
    links: "{count} liens (minimum : {shortest})",
    mysteryResult: "{difficulty} · {clues} indices",
    raceRoute: "{start} vers {target}",
    raceResult: "{clicks} clics",
    raceResultSingular: "{clicks} clic",
    timelineResult: "{correct} sur {total} événements · {difficulty}",
    easy: "Facile",
    medium: "Moyen",
    hard: "Difficile",
    date: "{date}",
    figureLoadError: "Certains noms n’ont pas pu être chargés. Des identifiants peuvent être affichés.",
    storageUnavailable: "Les statistiques n’ont pas pu être lues dans ce navigateur.",
    storageInvalid: "Les statistiques enregistrées sont illisibles. Terminez une nouvelle partie pour commencer un nouvel historique."
  }
};

let currentStatisticsLanguage = document.documentElement.lang === "fr" ? "fr" : "en";
let connectionFigureNames = {};
let mysteryFigureNames = {};
let figureNamesFailed = false;

function translateStatistics(key, replacements = {}) {
  let text = statisticsText[currentStatisticsLanguage][key];
  for (const [placeholder, value] of Object.entries(replacements)) {
    text = text.replace(`{${placeholder}}`, value);
  }
  return text;
}

function formatResultDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(currentStatisticsLanguage === "fr" ? "fr-FR" : "en", {
    dateStyle: "medium"
  }).format(date);
}

function renderResultItem(result, gameType) {
  const item = document.createElement("li");
  item.className = "result-item";

  const heading = document.createElement("div");
  heading.className = "result-heading";
  const title = document.createElement("strong");
  if (gameType === "connections") {
    title.textContent = translateStatistics("route", {
      start: connectionFigureNames[result.startId] || result.startId,
      target: connectionFigureNames[result.targetId] || result.targetId
    });
  } else if (gameType === "mystery") {
    title.textContent = mysteryFigureNames[result.figureId] || result.figureId;
  } else if (gameType === "race") {
    title.textContent = translateStatistics("raceRoute", {
      start: result.startTitle,
      target: result.targetTitle
    });
  } else {
    title.textContent = translateStatistics("timelineTitle");
  }

  const score = document.createElement("span");
  score.textContent = translateStatistics("score", { score: String(result.score) });
  heading.append(title, score);

  const details = document.createElement("p");
  let resultDetails;
  if (gameType === "connections") {
    resultDetails = translateStatistics("links", {
      count: String(result.links),
      shortest: String(result.shortestLinks)
    });
  } else if (gameType === "mystery") {
    resultDetails = translateStatistics("mysteryResult", {
      difficulty: translateStatistics(result.difficulty),
      clues: String(result.cluesUsed)
    });
  } else if (gameType === "race") {
    resultDetails = translateStatistics(result.clicks === 1 ? "raceResultSingular" : "raceResult", {
      clicks: String(result.clicks)
    });
  } else {
    resultDetails = translateStatistics("timelineResult", {
      correct: String(result.correctPositions),
      total: String(result.totalEvents),
      difficulty: translateStatistics(result.difficulty)
    });
  }
  details.textContent = `${resultDetails} · ${translateStatistics("date", { date: formatResultDate(result.completedAt) })}`;
  item.append(heading, details);
  return item;
}

function renderGameStatistics(stats, gameType) {
  const gameProperties = {
    connections: {
      results: stats.historicalConnections,
      prefix: "connections",
      total: stats.historicalConnectionsTotal,
      best: stats.historicalConnectionsBest
    },
    mystery: {
      results: stats.mysteryFigure,
      prefix: "mystery",
      total: stats.mysteryFigureTotal,
      best: stats.mysteryFigureBest
    },
    race: {
      results: stats.wikipediaRace,
      prefix: "race",
      total: stats.wikipediaRaceTotal,
      best: stats.wikipediaRaceBest
    },
    timeline: {
      results: stats.historicalTimeline,
      prefix: "timeline",
      total: stats.historicalTimelineTotal,
      best: stats.historicalTimelineBest
    }
  };
  const { results, prefix, total, best } = gameProperties[gameType];
  const list = document.querySelector(`#${prefix}-results-list`);
  const message = document.querySelector(`#${prefix}-statistics-message`);

  document.querySelector(`#${prefix}-games-played`).textContent = String(total);
  document.querySelector(`#${prefix}-best-score`).textContent = String(best);
  list.replaceChildren();
  message.textContent = "";

  if (figureNamesFailed && ["connections", "mystery"].includes(gameType)) {
    message.textContent = translateStatistics("figureLoadError");
  }
  if (!results.length) {
    message.textContent = translateStatistics(`${prefix}Empty`);
    return;
  }

  results.slice(-10).reverse().forEach((result) => {
    list.append(renderResultItem(result, gameType));
  });
}

function renderStatistics() {
  document.querySelectorAll("[data-stats-i18n]").forEach((element) => {
    element.textContent = translateStatistics(element.dataset.statsI18n);
  });

  let stats;
  try {
    stats = window.ChronoGameStats.readStats();
  } catch (error) {
    const message = error.message === "storage-invalid" ? "storageInvalid" : "storageUnavailable";
    ["connections", "mystery", "race", "timeline"].forEach((prefix) => {
      document.querySelector(`#${prefix}-results-list`).replaceChildren();
      document.querySelector(`#${prefix}-statistics-message`).textContent = translateStatistics(message);
      document.querySelector(`#${prefix}-games-played`).textContent = "0";
      document.querySelector(`#${prefix}-best-score`).textContent = "0";
    });
    console.error("Could not display saved game statistics.", error);
    return;
  }

  renderGameStatistics(stats, "connections");
  renderGameStatistics(stats, "mystery");
  renderGameStatistics(stats, "race");
  renderGameStatistics(stats, "timeline");
}

async function loadFigureNames() {
  figureNamesFailed = false;
  try {
    const [connectionsResponse, mysteryResponse] = await Promise.all([
      fetch("../data/historical-connections.json"),
      fetch("../data/mystery-figures.json")
    ]);
    if (!connectionsResponse.ok || !mysteryResponse.ok) {
      throw new Error("A figure data request failed.");
    }

    const [connectionsData, mysteryData] = await Promise.all([
      connectionsResponse.json(),
      mysteryResponse.json()
    ]);
    connectionFigureNames = Object.fromEntries(connectionsData.figures.map((figure) => [
      figure.id,
      figure.name[currentStatisticsLanguage]
    ]));
    mysteryFigureNames = Object.fromEntries(mysteryData.figures.map((figure) => [
      figure.id,
      figure.name[currentStatisticsLanguage]
    ]));
  } catch (error) {
    figureNamesFailed = true;
    console.error("Could not load figure names for statistics.", error);
  }
  renderStatistics();
}

document.addEventListener("languagechange", (event) => {
  currentStatisticsLanguage = event.detail.language;
  loadFigureNames();
});

loadFigureNames();
