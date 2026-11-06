const raceText = {
  en: {
    challengeEyebrow: "Your race",
    startLabel: "Start",
    destinationLabel: "Destination",
    instructions: "Article links count as clicks; section-guide jumps are free. Back undoes the last click, and Forward restores it. Changing language restarts the race.",
    clicksLabel: "Clicks",
    backHistory: "Back to previous article",
    forwardHistory: "Forward to next article",
    restart: "Restart race",
    viewWikipedia: "View on Wikipedia",
    newRace: "New race",
    howToPlayEyebrow: "How to play",
    howToPlayOne: "Read the current article and its underlined links.",
    howToPlayTwo: "Article links add a click. Back undoes that click; Forward restores it.",
    howToPlayThree: "Reach the destination using as few clicks as possible.",
    scoreNote: "Your score starts at 100 and decreases by 10 points per click.",
    loading: "Loading article…",
    apiError: "Wikipedia could not load this article. Check your connection and try again.",
    dataError: "Race challenges could not be loaded. Please try again later.",
    complete: "Destination reached in {clicks} clicks! You earned {score} points.",
    completeSingular: "Destination reached in {clicks} click! You earned {score} points.",
    scoreSaveError: "Your result could not be saved on this device.",
    routeLabel: "Your path",
    historyLabel: "Article navigation",
    showReferences: "Show citations and references",
    contentsTitle: "Contents",
    showContents: "Show",
    hideContents: "Hide",
    showAppearance: "Show appearance",
    hideAppearance: "Hide appearance",
    appearanceTitle: "Appearance",
    textSizeLabel: "Text size",
    textSmall: "Small",
    textStandard: "Standard",
    textLarge: "Large",
    widthLabel: "Width",
    widthStandard: "Standard",
    widthWide: "Wide",
    colorLabel: "Color",
    colorAuto: "Automatic",
    colorLight: "Light",
    colorDark: "Dark"
  },
  fr: {
    challengeEyebrow: "Votre course",
    startLabel: "Départ",
    destinationLabel: "Destination",
    instructions: "Les liens de l’article comptent comme des clics ; le sommaire est gratuit. Retour annule le dernier clic et Suivant le rétablit. Changer de langue recommence la course.",
    clicksLabel: "Clics",
    backHistory: "Revenir à l’article précédent",
    forwardHistory: "Aller à l’article suivant",
    restart: "Recommencer la course",
    viewWikipedia: "Voir sur Wikipédia",
    newRace: "Nouvelle course",
    howToPlayEyebrow: "Règles du jeu",
    howToPlayOne: "Lisez l’article affiché et ses liens soulignés.",
    howToPlayTwo: "Un lien vers un autre article ajoute un clic. Retour annule ce clic ; Suivant le rétablit.",
    howToPlayThree: "Atteignez la destination en utilisant le moins de clics possible.",
    scoreNote: "Votre score commence à 100 et diminue de 10 points par clic.",
    loading: "Chargement de l’article…",
    apiError: "Wikipédia n’a pas pu charger cet article. Vérifiez votre connexion et réessayez.",
    dataError: "Les défis de la course n’ont pas pu être chargés. Veuillez réessayer plus tard.",
    complete: "Destination atteinte en {clicks} clics ! Vous gagnez {score} points.",
    completeSingular: "Destination atteinte en {clicks} clic ! Vous gagnez {score} points.",
    scoreSaveError: "Votre résultat n’a pas pu être enregistré sur cet appareil.",
    routeLabel: "Votre parcours",
    historyLabel: "Navigation entre les articles",
    showReferences: "Afficher les citations et références",
    contentsTitle: "Sommaire",
    showContents: "Afficher",
    hideContents: "Masquer",
    showAppearance: "Afficher l’apparence",
    hideAppearance: "Masquer l’apparence",
    appearanceTitle: "Apparence",
    textSizeLabel: "Taille du texte",
    textSmall: "Petite",
    textStandard: "Normale",
    textLarge: "Grande",
    widthLabel: "Largeur",
    widthStandard: "Normale",
    widthWide: "Large",
    colorLabel: "Couleur",
    colorAuto: "Automatique",
    colorLight: "Clair",
    colorDark: "Sombre"
  }
};

const raceStart = document.querySelector("#race-start");
const raceTarget = document.querySelector("#race-target");
const raceArticleTitle = document.querySelector("#race-article-title");
const raceWikipediaLink = document.querySelector("#race-wikipedia-link");
const raceReaderLayout = document.querySelector("#race-reader-layout");
const raceArticle = document.querySelector(".race-article");
const raceExtract = document.querySelector("#race-extract");
const raceSectionNav = document.querySelector("#race-section-nav");
const raceSectionList = document.querySelector("#race-section-list");
const raceSectionToggle = document.querySelector("#race-section-toggle");
const raceAppearanceToggle = document.querySelector("#race-appearance-toggle");
const raceAppearanceContent = document.querySelector("#race-appearance-controls");
const raceClickCount = document.querySelector("#race-click-count");
const raceBack = document.querySelector("#race-back");
const raceForward = document.querySelector("#race-forward");
const racePath = document.createElement("ol");
const raceFeedback = document.querySelector("#race-feedback");
const raceRestart = document.querySelector("#race-restart");
const raceNewChallenge = document.querySelector("#race-new-challenge");
const appearanceControls = document.querySelector(".race-appearance");
const appearanceStorageKey = "chronoWikipediaRaceAppearance";
const appearanceSettings = loadAppearanceSettings();

racePath.className = "race-path";
document.querySelector(".race-status-row").after(racePath);

let currentLanguage = document.documentElement.lang === "fr" ? "fr" : "en";
let challengeData;
let currentChallenge;
let currentTitle = "";
let currentArticleHtml = "";
let clickCount = 0;
let route = [];
let raceHistory = [];
let raceForwardHistory = [];
let completed = false;
let articleLoading = false;
let saveFailed = false;
let previousChallengeIndex = -1;
let requestController;

function translateRace(key, replacements = {}) {
  let text = raceText[currentLanguage][key];
  for (const [placeholder, value] of Object.entries(replacements)) {
    text = text.replace(`{${placeholder}}`, value);
  }
  return text;
}

function getApiUrl(params) {
  const query = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    origin: "*",
    redirects: "1",
    ...params
  });
  return `https://${currentLanguage}.wikipedia.org/w/api.php?${query}`;
}

function normalizeTitle(title) {
  return title.replaceAll("_", " ").trim().replace(/\s+/g, " ").toLocaleLowerCase(currentLanguage);
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  const externalSignal = options.signal;
  const abortRequest = () => controller.abort();
  externalSignal?.addEventListener("abort", abortRequest, { once: true });

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted && !externalSignal?.aborted) {
      throw new Error("Wikipedia request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", abortRequest);
  }
}

function renderStaticText() {
  document.querySelectorAll("[data-race-i18n]").forEach((element) => {
    element.textContent = translateRace(element.dataset.raceI18n);
  });
  racePath.setAttribute("aria-label", translateRace("routeLabel"));
  raceSectionNav.setAttribute("aria-label", translateRace("contentsTitle"));
  const contentsExpanded = raceSectionToggle.getAttribute("aria-expanded") === "true";
  const contentsKey = contentsExpanded ? "hideContents" : "showContents";
  raceSectionToggle.setAttribute("aria-label", translateRace(contentsKey));
  raceSectionToggle.title = translateRace(contentsKey);
  raceSectionList.hidden = !contentsExpanded;
  const appearanceExpanded = raceAppearanceToggle.getAttribute("aria-expanded") === "true";
  const appearanceKey = appearanceExpanded ? "hideAppearance" : "showAppearance";
  raceAppearanceToggle.setAttribute("aria-label", translateRace(appearanceKey));
  raceAppearanceToggle.title = translateRace(appearanceKey);
  raceAppearanceContent.hidden = !appearanceExpanded;
  raceBack.setAttribute("aria-label", translateRace("backHistory"));
  raceForward.setAttribute("aria-label", translateRace("forwardHistory"));
  document.querySelector(".race-history-controls").setAttribute("aria-label", translateRace("historyLabel"));
  document.querySelectorAll(".race-appearance-options").forEach((group) => {
    group.setAttribute("aria-label", translateRace(group.closest(".race-appearance-control").querySelector("legend").dataset.raceI18n));
  });
  applyAppearanceSettings();
}

function loadAppearanceSettings() {
  const defaults = {
    textSize: "standard",
    width: "wide",
    color: "dark",
    contentsExpanded: true,
    appearanceExpanded: true
  };
  try {
    const stored = JSON.parse(localStorage.getItem("chronoWikipediaRaceAppearance") || "{}");
    const validValues = {
      textSize: ["small", "standard", "large"],
      width: ["standard", "wide"],
      color: ["auto", "light", "dark"]
    };
    for (const [setting, allowedValues] of Object.entries(validValues)) {
      if (allowedValues.includes(stored[setting])) {
        defaults[setting] = stored[setting];
      }
    }
    if (typeof stored.contentsExpanded === "boolean") {
      defaults.contentsExpanded = stored.contentsExpanded;
    }
    if (typeof stored.appearanceExpanded === "boolean") {
      defaults.appearanceExpanded = stored.appearanceExpanded;
    }
  } catch (error) {
    console.error("Could not load Wikipedia Race appearance preferences.", error);
  }
  return defaults;
}

function applyAppearanceSettings() {
  raceReaderLayout.dataset.width = appearanceSettings.width;
  raceArticle.dataset.readerTextSize = appearanceSettings.textSize;
  raceArticle.dataset.readerColor = appearanceSettings.color;
  raceReaderLayout.classList.toggle("contents-collapsed", !appearanceSettings.contentsExpanded);
  raceReaderLayout.classList.toggle("appearance-collapsed", !appearanceSettings.appearanceExpanded);
  raceSectionToggle.setAttribute("aria-expanded", String(appearanceSettings.contentsExpanded));
  raceAppearanceToggle.setAttribute("aria-expanded", String(appearanceSettings.appearanceExpanded));
  raceSectionList.hidden = !appearanceSettings.contentsExpanded;
  raceAppearanceContent.hidden = !appearanceSettings.appearanceExpanded;
  appearanceControls.querySelectorAll("[data-appearance-setting]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(appearanceSettings[button.dataset.appearanceSetting] === button.dataset.appearanceValue)
    );
  });
}

function saveAppearanceSettings() {
  try {
    localStorage.setItem(appearanceStorageKey, JSON.stringify(appearanceSettings));
  } catch (error) {
    console.error("Could not save Wikipedia Race appearance preferences.", error);
  }
}

function updateAppearanceSetting(setting, value) {
  appearanceSettings[setting] = value;
  applyAppearanceSettings();
  saveAppearanceSettings();
}

function renderRoute() {
  racePath.replaceChildren();
  route.forEach((title) => {
    const item = document.createElement("li");
    item.textContent = title;
    racePath.append(item);
  });
}

function renderFeedback(message) {
  raceFeedback.replaceChildren();
  if (message) {
    const text = document.createElement("span");
    text.textContent = message;
    raceFeedback.append(text);
  }
  if (saveFailed) {
    const warning = document.createElement("span");
    warning.className = "score-save-error";
    warning.textContent = translateRace("scoreSaveError");
    raceFeedback.append(warning);
  }
}

function renderChallenge() {
  renderStaticText();
  raceStart.textContent = currentChallenge?.start[currentLanguage] || "—";
  raceTarget.textContent = currentChallenge?.target[currentLanguage] || "—";
  raceClickCount.textContent = String(clickCount);
  updateHistoryButtons();
  renderRoute();
}

function updateHistoryButtons() {
  raceBack.disabled = completed || articleLoading || raceHistory.length === 0;
  raceForward.disabled = completed || articleLoading || raceForwardHistory.length === 0;
}

function captureCurrentPage() {
  return {
    title: currentTitle,
    html: currentArticleHtml,
    windowScrollTop: window.scrollY,
    sectionNavScrollTop: raceSectionNav.scrollTop,
    link: raceWikipediaLink.href,
    route: [...route]
  };
}

function restorePage(page) {
  currentTitle = page.title;
  currentArticleHtml = page.html;
  route = page.route;
  renderRoute();
  raceArticleTitle.textContent = page.title;
  renderArticleContent(page.html);
  raceSectionNav.scrollTop = page.sectionNavScrollTop;
  raceWikipediaLink.href = page.link;
  raceWikipediaLink.hidden = false;
  window.scrollTo(0, page.windowScrollTop);
  renderFeedback("");
}

function getInternalArticleTitle(href) {
  try {
    const url = new URL(href, `https://${currentLanguage}.wikipedia.org`);
    if (url.hostname !== `${currentLanguage}.wikipedia.org` || !url.pathname.startsWith("/wiki/")) {
      return "";
    }

    const title = decodeURIComponent(url.pathname.slice("/wiki/".length)).replaceAll("_", " ");
    return title && !title.includes(":") ? title : "";
  } catch {
    return "";
  }
}

function appendSafeArticleContent(parent, sourceNode) {
  if (sourceNode.nodeType === Node.TEXT_NODE) {
    parent.append(document.createTextNode(sourceNode.textContent));
    return;
  }
  if (sourceNode.nodeType !== Node.ELEMENT_NODE) {
    return;
  }
  const excludedClasses = ["mw-editsection", "mw-empty-elt", "noprint", "navbox", "catlinks"];
  if (["STYLE", "SCRIPT", "LINK", "META"].includes(sourceNode.tagName)
    || excludedClasses.some((className) => sourceNode.classList.contains(className))) {
    return;
  }

  if (sourceNode.tagName === "A") {
    const title = getInternalArticleTitle(sourceNode.getAttribute("href") || "");
    if (title) {
      const link = document.createElement("a");
      link.className = "race-inline-link";
      link.href = `https://${currentLanguage}.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`;
      link.addEventListener("click", (event) => {
        event.preventDefault();
        if (!completed) {
          loadArticle(title, true);
        }
      });
      Array.from(sourceNode.childNodes).forEach((child) => appendSafeArticleContent(link, child));
      parent.append(link);
      return;
    }
  }

  const allowedTags = new Set([
    "P", "DIV", "BLOCKQUOTE", "H2", "H3", "H4", "H5", "H6",
    "B", "STRONG", "I", "EM", "UL", "OL", "LI", "BR", "SMALL",
    "SUB", "SUP", "SPAN", "DL", "DT", "DD", "TABLE", "CAPTION",
    "THEAD", "TBODY", "TFOOT", "TR", "TH", "TD"
  ]);
  if (!allowedTags.has(sourceNode.tagName)) {
    Array.from(sourceNode.childNodes).forEach((child) => appendSafeArticleContent(parent, child));
    return;
  }

  const safeElement = document.createElement(sourceNode.tagName.toLowerCase());
  Array.from(sourceNode.childNodes).forEach((child) => appendSafeArticleContent(safeElement, child));
  parent.append(safeElement);
}

function renderArticleContent(html) {
  const parsedDocument = new DOMParser().parseFromString(html, "text/html");
  const fragment = document.createDocumentFragment();
  const articleBody = parsedDocument.querySelector(".mw-parser-output") || parsedDocument.body;
  const sectionFragment = document.createDocumentFragment();
  let contentAdded = 0;
  let sectionsAdded = 0;
  let headingCount = 0;
  let collapsibleContent = null;

  for (const child of articleBody.children) {
    const sourceHeading = /^H[2-6]$/.test(child.tagName)
      ? child
      : child.classList.contains("mw-heading")
        ? child.querySelector("h2, h3, h4, h5, h6")
        : null;

    if (sourceHeading) {
      if (sourceHeading.tagName === "H2") {
        collapsibleContent = null;
      }
      const heading = document.createElement(sourceHeading.tagName.toLowerCase());
      const headingText = sourceHeading.querySelector(".mw-headline") || sourceHeading;
      const sectionId = `race-section-${++headingCount}`;
      heading.id = sectionId;
      Array.from(headingText.childNodes).forEach((node) => appendSafeArticleContent(heading, node));
      const label = heading.textContent.trim().replace(/\s+/g, " ");

      if (label && sourceHeading.tagName === "H2") {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.className = "race-section-link";
        link.href = `#${sectionId}`;
        link.textContent = label;
        item.append(link);
        sectionFragment.append(item);
        sectionsAdded += 1;
      }

      fragment.append(heading);
      if (sourceHeading.tagName === "H2" && isReferenceSection(label)) {
        const details = document.createElement("details");
        details.className = "race-reference-details";
        const summary = document.createElement("summary");
        summary.textContent = translateRace("showReferences");
        details.append(summary);
        fragment.append(details);
        collapsibleContent = details;
      }
      continue;
    }
    appendSafeArticleContent(collapsibleContent || fragment, child);
    contentAdded += 1;
  }
  if (!contentAdded) {
    throw new Error("Wikipedia article has no readable content.");
  }
  raceExtract.replaceChildren(fragment);
  raceSectionList.replaceChildren(sectionFragment);
  raceReaderLayout.classList.toggle("without-contents", sectionsAdded === 0);
  raceSectionNav.hidden = sectionsAdded === 0;
  applyAppearanceSettings();
}

function isReferenceSection(label) {
  const normalizedLabel = label
    .replace(/\[[^\]]*\]/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w]+/g, " ")
    .trim();
  return /^(references?|citations?|notes?|footnotes?|sources?|bibliography|bibliographies|works cited|further reading|references and notes|notes and references|citations and references|citations and notes|notes et references|citations et references|citations et notes|sources et references|lectures complementaires)$/.test(normalizedLabel);
}

async function fetchArticle(title) {
  const response = await fetchWithTimeout(getApiUrl({
    action: "parse",
    page: title,
    prop: "text",
    disableeditsection: "1"
  }), { signal: requestController.signal });
  if (!response.ok) {
    throw new Error(`Wikipedia API request failed: ${response.status}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(`Wikipedia API error: ${data.error.info}`);
  }
  const page = data.parse;
  if (!page?.text) {
    throw new Error(`Wikipedia article not found: ${title}`);
  }
  return { title: page.title, html: page.text };
}

async function loadArticle(title, countClick = false) {
  if (completed) {
    return;
  }

  const previousPage = captureCurrentPage();
  requestController?.abort();
  requestController = new AbortController();
  if (countClick) {
    clickCount += 1;
    raceClickCount.textContent = String(clickCount);
  }
  articleLoading = true;
  updateHistoryButtons();
  raceArticleTitle.textContent = translateRace("loading");
  raceExtract.replaceChildren();
  raceSectionList.replaceChildren();
  raceSectionNav.scrollTop = 0;
  raceSectionNav.hidden = true;
  raceWikipediaLink.hidden = true;
  renderFeedback("");

  try {
    const page = await fetchArticle(title);
    if (countClick && previousPage.title) {
      raceHistory.push(previousPage);
      raceForwardHistory = [];
    }
    currentTitle = page.title;
    route = countClick ? [...route, currentTitle] : [currentTitle];
    renderRoute();

    raceArticleTitle.textContent = currentTitle;
    renderArticleContent(page.html);
    articleLoading = false;
    updateHistoryButtons();
    currentArticleHtml = page.html;
    raceWikipediaLink.href = `https://${currentLanguage}.wikipedia.org/wiki/${encodeURIComponent(currentTitle.replaceAll(" ", "_"))}`;
    raceWikipediaLink.hidden = false;

    if (normalizeTitle(currentTitle) === normalizeTitle(currentChallenge.target[currentLanguage])) {
      finishRace();
    } else if (countClick) {
      renderFeedback("");
    }
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }
    articleLoading = false;
    console.error("Could not load a Wikipedia Race article.", error);
    if (countClick && previousPage.title) {
      clickCount = Math.max(0, clickCount - 1);
      raceClickCount.textContent = String(clickCount);
      currentTitle = previousPage.title;
      currentArticleHtml = previousPage.html;
      route = previousPage.route;
      renderRoute();
      raceArticleTitle.textContent = previousPage.title;
      renderArticleContent(previousPage.html);
      raceSectionNav.scrollTop = previousPage.sectionNavScrollTop;
      window.scrollTo(0, previousPage.windowScrollTop);
      raceWikipediaLink.href = previousPage.link;
      raceWikipediaLink.hidden = false;
    } else {
      raceArticleTitle.textContent = title;
    }
    updateHistoryButtons();
    renderFeedback(translateRace("apiError"));
  }
}

function returnToPreviousArticle() {
  if (completed || articleLoading || !raceHistory.length) {
    return;
  }

  requestController?.abort();
  const previousPage = raceHistory.pop();
  raceForwardHistory.push(captureCurrentPage());
  clickCount = Math.max(0, clickCount - 1);
  raceClickCount.textContent = String(clickCount);
  restorePage(previousPage);
  updateHistoryButtons();
}

function advanceToNextArticle() {
  if (completed || articleLoading || !raceForwardHistory.length) {
    return;
  }

  const nextPage = raceForwardHistory.pop();
  raceHistory.push(captureCurrentPage());
  clickCount += 1;
  raceClickCount.textContent = String(clickCount);
  restorePage(nextPage);
  if (normalizeTitle(currentTitle) === normalizeTitle(currentChallenge.target[currentLanguage])) {
    finishRace();
  } else {
    updateHistoryButtons();
  }
}

function finishRace() {
  completed = true;
  const score = Math.max(0, 100 - clickCount * 10);
  const key = clickCount === 1 ? "completeSingular" : "complete";
  const message = translateRace(key, {
    clicks: String(clickCount),
    score: String(score)
  });

  try {
    window.ChronoGameStats.recordWikipediaRace({
      score,
      clicks: clickCount,
      startTitle: route[0],
      targetTitle: currentChallenge.target[currentLanguage],
      language: currentLanguage
    });
  } catch (error) {
    console.error("Could not save the completed Wikipedia Race.", error);
    saveFailed = true;
  }
  raceExtract.querySelectorAll(".race-inline-link").forEach((link) => {
    link.setAttribute("aria-disabled", "true");
    link.tabIndex = -1;
  });
  updateHistoryButtons();
  renderFeedback(message);
}

function chooseChallenge() {
  if (!challengeData?.challenges.length) {
    return;
  }
  const availableIndices = challengeData.challenges.length > 1
    ? challengeData.challenges.map((_, index) => index).filter((index) => index !== previousChallengeIndex)
    : challengeData.challenges.map((_, index) => index);
  const index = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  previousChallengeIndex = index;
  currentChallenge = challengeData.challenges[index];
  resetRace();
}

function resetRace() {
  if (!currentChallenge) {
    loadChallengeData();
    return;
  }
  requestController?.abort();
  clickCount = 0;
  route = [];
  raceHistory = [];
  raceForwardHistory = [];
  completed = false;
  articleLoading = false;
  saveFailed = false;
  raceClickCount.textContent = "0";
  renderChallenge();
  renderFeedback("");
  loadArticle(currentChallenge.start[currentLanguage]);
}

function loadChallengeData() {
  try {
    challengeData = window.ChronoWikipediaRaceChallenges;
    if (!Array.isArray(challengeData.challenges) || !challengeData.challenges.length
      || challengeData.challenges.some((challenge) => !challenge.start?.en || !challenge.start?.fr
        || !challenge.target?.en || !challenge.target?.fr)) {
      throw new Error("Race challenge data has an invalid structure.");
    }
    chooseChallenge();
  } catch (error) {
    console.error("Could not initialize Wikipedia Race.", error);
    renderStaticText();
    raceArticleTitle.textContent = "—";
    renderFeedback(translateRace("dataError"));
  }
}

raceRestart.addEventListener("click", resetRace);
raceBack.addEventListener("click", returnToPreviousArticle);
raceForward.addEventListener("click", advanceToNextArticle);
raceNewChallenge.addEventListener("click", chooseChallenge);
raceSectionToggle.addEventListener("click", () => {
  const isExpanded = raceSectionToggle.getAttribute("aria-expanded") === "true";
  const nextExpanded = !isExpanded;
  raceSectionToggle.setAttribute("aria-expanded", String(nextExpanded));
  appearanceSettings.contentsExpanded = nextExpanded;
  applyAppearanceSettings();
  saveAppearanceSettings();
  renderStaticText();
});
raceAppearanceToggle.addEventListener("click", () => {
  appearanceSettings.appearanceExpanded = raceAppearanceToggle.getAttribute("aria-expanded") !== "true";
  applyAppearanceSettings();
  saveAppearanceSettings();
  renderStaticText();
});
raceSectionNav.addEventListener("click", (event) => {
  const link = event.target.closest(".race-section-link");
  if (!link || !raceSectionNav.contains(link)) {
    return;
  }
  event.preventDefault();
  const heading = document.querySelector(link.hash);
  if (!heading) {
    return;
  }
  heading.scrollIntoView({ behavior: "smooth", block: "start" });
  raceSectionNav.querySelectorAll(".race-section-link").forEach((sectionLink) => {
    sectionLink.removeAttribute("aria-current");
  });
  link.setAttribute("aria-current", "location");
});
appearanceControls.addEventListener("click", (event) => {
  const button = event.target.closest("[data-appearance-setting]");
  if (!button || !appearanceControls.contains(button)) {
    return;
  }
  updateAppearanceSetting(button.dataset.appearanceSetting, button.dataset.appearanceValue);
});
document.addEventListener("languagechange", (event) => {
  const newLanguage = event.detail.language;
  if (newLanguage === currentLanguage) {
    return;
  }
  currentLanguage = newLanguage;
  if (currentChallenge) {
    resetRace();
  } else {
    renderStaticText();
  }
});

renderStaticText();
applyAppearanceSettings();
loadChallengeData();
