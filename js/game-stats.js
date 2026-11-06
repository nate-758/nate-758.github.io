(function () {
  const storageKey = "chronoConnectionsStats";

  function readStats() {
    let storedValue;
    try {
      storedValue = localStorage.getItem(storageKey);
    } catch (error) {
      console.error("Could not read saved game statistics.", error);
      throw new Error("storage-unavailable");
    }

    if (!storedValue) {
      return {
        historicalConnections: [],
        historicalConnectionsTotal: 0,
        historicalConnectionsBest: 0,
        mysteryFigure: [],
        mysteryFigureTotal: 0,
        mysteryFigureBest: 0,
        wikipediaRace: [],
        wikipediaRaceTotal: 0,
        wikipediaRaceBest: 0,
        historicalTimeline: [],
        historicalTimelineTotal: 0,
        historicalTimelineBest: 0
      };
    }

    try {
      const stats = JSON.parse(storedValue);
      if (!stats || !Array.isArray(stats.historicalConnections)) {
        throw new Error("Saved game statistics have an invalid format.");
      }
      if (!Array.isArray(stats.mysteryFigure)) {
        stats.mysteryFigure = [];
      }
      if (!Array.isArray(stats.wikipediaRace)) {
        stats.wikipediaRace = [];
      }
      if (!Array.isArray(stats.historicalTimeline)) {
        stats.historicalTimeline = [];
      }
      if (!Number.isInteger(stats.historicalConnectionsTotal) || stats.historicalConnectionsTotal < stats.historicalConnections.length) {
        stats.historicalConnectionsTotal = stats.historicalConnections.length;
      }
      if (!Number.isInteger(stats.mysteryFigureTotal) || stats.mysteryFigureTotal < stats.mysteryFigure.length) {
        stats.mysteryFigureTotal = stats.mysteryFigure.length;
      }
      if (!Number.isInteger(stats.wikipediaRaceTotal) || stats.wikipediaRaceTotal < stats.wikipediaRace.length) {
        stats.wikipediaRaceTotal = stats.wikipediaRace.length;
      }
      if (!Number.isInteger(stats.historicalTimelineTotal) || stats.historicalTimelineTotal < stats.historicalTimeline.length) {
        stats.historicalTimelineTotal = stats.historicalTimeline.length;
      }
      if (stats.historicalConnections.some((result) =>
        !Number.isInteger(result.score)
        || !Number.isInteger(result.links)
        || !Number.isInteger(result.shortestLinks)
        || typeof result.startId !== "string"
        || typeof result.targetId !== "string"
        || typeof result.completedAt !== "string"
      )) {
        throw new Error("Saved game results have an invalid format.");
      }
      if (stats.mysteryFigure.some((result) =>
        !Number.isInteger(result.score)
        || typeof result.figureId !== "string"
        || !["easy", "medium", "hard"].includes(result.difficulty)
        || !Number.isInteger(result.cluesUsed)
        || typeof result.completedAt !== "string"
      )) {
        throw new Error("Saved Mystery Figure results have an invalid format.");
      }
      if (stats.wikipediaRace.some((result) =>
        !Number.isInteger(result.score)
        || !Number.isInteger(result.clicks)
        || typeof result.startTitle !== "string"
        || typeof result.targetTitle !== "string"
        || !["en", "fr"].includes(result.language)
        || typeof result.completedAt !== "string"
      )) {
        throw new Error("Saved Wikipedia Race results have an invalid format.");
      }
      if (stats.historicalTimeline.some((result) =>
        !Number.isInteger(result.score)
        || !Number.isInteger(result.correctPositions)
        || !Number.isInteger(result.totalEvents)
        || !["easy", "medium", "hard"].includes(result.difficulty)
        || typeof result.completedAt !== "string"
      )) {
        throw new Error("Saved Historical Timeline results have an invalid format.");
      }
      const historicalBest = stats.historicalConnections.reduce((best, result) => Math.max(best, result.score), 0);
      if (!Number.isInteger(stats.historicalConnectionsBest) || stats.historicalConnectionsBest < historicalBest) {
        stats.historicalConnectionsBest = historicalBest;
      }
      const mysteryBest = stats.mysteryFigure.reduce((best, result) => Math.max(best, result.score), 0);
      if (!Number.isInteger(stats.mysteryFigureBest) || stats.mysteryFigureBest < mysteryBest) {
        stats.mysteryFigureBest = mysteryBest;
      }
      const raceBest = stats.wikipediaRace.reduce((best, result) => Math.max(best, result.score), 0);
      if (!Number.isInteger(stats.wikipediaRaceBest) || stats.wikipediaRaceBest < raceBest) {
        stats.wikipediaRaceBest = raceBest;
      }
      const timelineBest = stats.historicalTimeline.reduce((best, result) => Math.max(best, result.score), 0);
      if (!Number.isInteger(stats.historicalTimelineBest) || stats.historicalTimelineBest < timelineBest) {
        stats.historicalTimelineBest = timelineBest;
      }
      return stats;
    } catch (error) {
      console.error("Saved game statistics could not be parsed.", error);
      throw new Error("storage-invalid");
    }
  }

  function writeStats(stats) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(stats));
    } catch (error) {
      console.error("Could not save game statistics.", error);
      throw new Error("storage-unavailable");
    }
  }

  function recordHistoricalConnections(result) {
    const stats = readStats();
    stats.historicalConnectionsTotal += 1;
    stats.historicalConnections.push({
      score: result.score,
      links: result.links,
      shortestLinks: result.shortestLinks,
      startId: result.startId,
      targetId: result.targetId,
      completedAt: new Date().toISOString()
    });
    stats.historicalConnectionsBest = Math.max(stats.historicalConnectionsBest, result.score);
    stats.historicalConnections = stats.historicalConnections.slice(-100);
    writeStats(stats);
  }

  function recordMysteryFigure(result) {
    const stats = readStats();
    stats.mysteryFigureTotal += 1;
    stats.mysteryFigure.push({
      score: result.score,
      figureId: result.figureId,
      difficulty: result.difficulty,
      cluesUsed: result.cluesUsed,
      completedAt: new Date().toISOString()
    });
    stats.mysteryFigureBest = Math.max(stats.mysteryFigureBest, result.score);
    stats.mysteryFigure = stats.mysteryFigure.slice(-100);
    writeStats(stats);
  }

  function recordWikipediaRace(result) {
    const stats = readStats();
    stats.wikipediaRaceTotal += 1;
    stats.wikipediaRace.push({
      score: result.score,
      clicks: result.clicks,
      startTitle: result.startTitle,
      targetTitle: result.targetTitle,
      language: result.language,
      completedAt: new Date().toISOString()
    });
    stats.wikipediaRaceBest = Math.max(stats.wikipediaRaceBest, result.score);
    stats.wikipediaRace = stats.wikipediaRace.slice(-100);
    writeStats(stats);
  }

  function recordHistoricalTimeline(result) {
    const stats = readStats();
    stats.historicalTimelineTotal += 1;
    stats.historicalTimeline.push({
      score: result.score,
      correctPositions: result.correctPositions,
      totalEvents: result.totalEvents,
      difficulty: result.difficulty,
      completedAt: new Date().toISOString()
    });
    stats.historicalTimelineBest = Math.max(stats.historicalTimelineBest, result.score);
    stats.historicalTimeline = stats.historicalTimeline.slice(-100);
    writeStats(stats);
  }

  window.ChronoGameStats = {
    readStats,
    recordHistoricalConnections,
    recordMysteryFigure,
    recordWikipediaRace,
    recordHistoricalTimeline
  };
})();
