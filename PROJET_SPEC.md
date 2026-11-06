# ChronoConnections — Project Specification

## 1. Project Overview

ChronoConnections is a bilingual educational gaming website focused on history.

The objective is to make learning history entertaining through four interactive game modes that challenge players' historical knowledge, reasoning, research and understanding of historical events.

### General Information

- **Project name:** ChronoConnections
- **Languages:** English and French
- **Technologies:** HTML5, CSS3 and Vanilla JavaScript
- **Hosting:** GitHub Pages
- **Architecture:** Static, client-side website
- **Data storage:** JSON files and LocalStorage
- **External integration:** Wikipedia API
- **Design:** Modern gaming aesthetics combined with historical elements.

## 2. Game Modes

### Mode 1 — Historical Connections

Players must connect two historical figures through verified historical relationships.

Possible connections include:
- Family relationships.
- Political alliances.
- Wars and conflicts.
- Teacher/student relationships.
- Collaborations and diplomatic relationships.

The game should validate connections using a curated historical database.

Each connection should have a supporting historical source.

### Mode 2 — Wikipedia Race

Players receive two Wikipedia articles and must navigate from the starting article to the destination using internal Wikipedia links.

Features:
- Count the number of clicks.
- Optional time limit.
- Track the navigation path.
- Support English and French Wikipedia.
- Reward players for reaching the destination efficiently.

Use the Wikipedia API to retrieve and display article content within the website.

### Mode 3 — Mystery Figure

Players must identify a historical figure using progressively revealed clues.

Features:
- Five clues per challenge.
- Points awarded according to how early the player answers correctly.
- Multiple difficulty levels.
- Randomized historical figures.
- Display the correct answer and additional historical information after completion.

Suggested scoring:
- First clue: 5 points.
- Second clue: 4 points.
- Third clue: 3 points.
- Fourth clue: 2 points.
- Fifth clue: 1 point.

### Mode 4 — Historical Timeline

Players must arrange historical events in chronological order.

Features:
- Interactive event cards.
- Drag-and-drop functionality.
- Historical dates revealed after submission.
- Score based on correct positioning.
- Increasing difficulty levels.

## 3. Website Structure

The website should contain:

### Homepage
- Website logo and identity.
- Navigation bar.
- Introduction to the project.
- Four game mode selection cards.
- Language selector.
- Footer.

### Individual Game Pages
- Historical Connections.
- Wikipedia Race.
- Mystery Figure.
- Historical Timeline.

Each game should have its own instructions, gameplay interface and results screen.

### Statistics Page
- Total games played.
- Personal best scores.
- Performance statistics.
- Previous results where practical.

## 4. Visual Identity

The website should combine historical aesthetics with modern gaming design.

### Design Direction
- Dark backgrounds.
- Elegant gold accents.
- Historical portraits and photographs.
- Subtle parchment-inspired textures.
- Modern interactive cards.
- Smooth animations and transitions.
- Clear typography and readable interfaces.

The website should look professional rather than like a basic school assignment.

### Responsiveness
The website must work on:
- Desktop computers.
- Tablets.
- Mobile phones.

## 5. Bilingual Functionality

The website must support English and French.

Include an EN / FR language selector in the navigation bar.

All interface elements should be translated, including:
- Navigation.
- Game instructions.
- Buttons.
- Questions and messages.
- Results and statistics.
- Error messages.

The language should change without requiring a complete page reload.

Wikipedia Race should use the corresponding language edition of Wikipedia.

## 6. Technical Requirements

### HTML
Responsible for the website structure and content.

### CSS
Responsible for:
- Visual design.
- Layout.
- Animations.
- Responsive behaviour.

### JavaScript
Responsible for:
- Game logic.
- Scoring.
- Timers.
- Randomized challenges.
- Language switching.
- API integration.
- LocalStorage.

### JSON
Used to organise structured historical information, including:
- Historical figures.
- Historical relationships.
- Mystery clues.
- Historical events.

### Wikipedia API
Used to retrieve Wikipedia article information and internal links.

### LocalStorage
Used to save:
- Language preferences.
- Personal best scores.
- Game statistics.
- Other relevant settings.

## 7. Scoring and Difficulty

Each game mode should have its own scoring system appropriate to its gameplay.

Include three difficulty levels:

**Easy**
- Famous historical figures.
- Straightforward relationships.
- Well-known historical events.

**Medium**
- Less obvious relationships.
- More challenging clues.
- Greater chronological variety.

**Hard**
- Complex historical relationships.
- Less familiar historical figures.
- More challenging historical events.