# CRM Simulator

Link to Site: https://kcarlos57.github.io/CRM-Simulator/

A browser-based contact centre CRM training tool for beginner agents. Practice real workflows — caller identity, case logging, call timing, and wrap-up — in a safe, offline environment with no live data, no server, and no risk of affecting real customers.

---

## Getting Started

### Requirements

No installation required. The simulator runs entirely in your browser as a set of static files.

- A modern desktop browser (Chrome, Edge, Firefox, or Safari)
- The three project files kept in the same folder:
  - `index.html`
  - `crm-simulator.css`
  - `crm-simulator.js`

### Running the Simulator

1. Download or clone the repository
2. Open `index.html` in your browser — either double-click it in File Explorer or drag it into a browser window
3. A welcome guide will appear on first load explaining how to use the tool
4. That's it — no build step, no dependencies, no internet connection required (fonts will load from Google Fonts if online)

### Saving Your Work

Everything you type is saved automatically to your browser's `localStorage`. Your data persists between sessions — close the tab and reopen it and your interaction will still be there. To manually save at any point, use **Save Draft** in the wrap-up bar at the bottom of the screen.

> **Note:** `localStorage` is tied to the browser and device you're using. Clearing your browser data will erase saved CRM entries and sticky notes.

---

## How to Use

### Basic Workflow

Follow this loop to simulate a real contact centre interaction from start to finish:

1. **Pick a company** from the tabs in the top bar — each has its own colour theme, agent ID, queue name, and outage message
2. **Start the call timer** (top right) the moment the call begins — builds the habit of tracking handle time
3. **Fill in Caller Identity** first: name, account number, phone. Verifying the caller is always step one
4. **Log the case** in the centre panel: select a category, set priority, and write case notes as the call progresses — don't wait until the end
5. **Use Quick Actions** on the right to simulate transfers, holds, escalations, and other mid-call actions
6. **Stop the timer** when the call ends
7. **Fill in the Wrap-Up Bar** at the bottom: pick a disposition code and survey consent — the ACW timer starts automatically when you click Save & Close
8. **Save & Close** the interaction

### Settings Panel

Click the **SETTINGS** tab on the left edge of the screen to open the settings panel. From here you can:

- Switch between company themes
- Toggle individual panels on or off to reduce screen complexity
- Use the group toggles to hide entire sections at once
- Use the master toggle to show or hide everything in one click
- Adjust accessibility options (font, contrast, text size)
- Generate a new Case/Interaction ID
- Clear the current interaction or wipe all saved data

### Sticky Notes

Click **✎ + NOTE** (bottom right) to create a floating note. Notes are draggable, colour-coded, and persist between sessions. Each new note pre-fills with a customer detail template. Use them to jot down order numbers, phonetic spellings, or anything you need during the call.

### Beginner Tips

- **Start with less.** On your first sessions, turn off Account Status, Customer Flags, and Interaction History in Settings. Focus only on Caller Identity → Case Notes → Wrap-Up. Add panels back one by one as you get comfortable.
- **Use fake but realistic data.** Treat every field as real — made-up names, plausible order numbers, actual issue descriptions. The more seriously you treat the simulation, the more transferable the skills.
- **Re-open the welcome guide** any time from **Settings → Help → Re-open Welcome Guide**.

---

## Features

### Company Themes
- Four company profiles: **Generic Company**, **PB Tech**, **JB Hi-Fi**, **Harvey Norman**
- Each theme has a distinct accent colour, agent ID, queue name, and outage banner message
- Switch instantly via the top bar tabs or the Settings panel radio buttons

### CRM Layout
- **Left panel — Caller Identity:** full name, account number, customer ID, phone, email, account type, customer since date, preferred contact method, linked accounts
- **Left panel — Account Status:** standing badge (Active / Suspended / Pending / Closed), balance, next payment due, active products, recent order and transaction
- **Left panel — Customer Flags:** Vulnerable Customer, Do Not Contact, Fraud Watch, Deceased, In Mediation, VIP Priority, Callback Requested — each with a colour-coded indicator dot
- **Centre panel — Case / Ticket:** channel, case status with live badge, category and sub-category, priority selector (Low / Medium / High / Urgent), order and SKU references, case notes, resolution notes, internal notes, follow-up task, assigned agent, estimated resolution date, compliance notes
- **Right panel — Quick Actions:** 11 buttons covering Transfer, Hold, Conference, Callback, Email, SMS, Knowledge Base, Escalate, New Linked Case, Flag for Review, Raise Fraud Alert
- **Right panel — Interaction History:** five sample past interactions showing channel, date, duration, outcome badge, description, and agent
- **Wrap-Up Bar:** disposition code dropdown, survey consent selector, ACW timer, Save & Close, Save Draft, New buttons

### Call Timer
- Count-up timer (HH:MM:SS) in the top-right corner
- Single toggle button — one click to start, one click to stop
- Reset button to clear back to 00:00:00
- Timer stops automatically when Save & Close is clicked

### ACW Timer
- Separate After Call Work count-up timer (MM:SS) in the wrap-up bar
- Starts automatically when Save & Close is clicked
- Manual toggle and reset buttons for independent control

### Sticky Notes
- Draggable floating notes, positioned anywhere on screen
- Five colour options: Yellow, Blue, Green, Pink, Orange
- Editable title and free-text body
- New notes pre-fill with a customer detail template
- Positions and content persist to localStorage between sessions

### Settings Panel
- Slides in from the left edge of the screen
- **Master toggle** — show or hide all panels and features at once
- **Group toggles** — one toggle per section (Left Column, Centre & Right, Features) to collapse entire groups
- **Individual toggles** — fine-grained control over every panel
- Group and master toggles stay bidirectionally in sync with individual toggles
- All toggle states persist between sessions

### Accessibility
- **Font:** Default (IBM Plex Sans), System UI, Lexend, Atkinson Hyperlegible, Monospace
- **Color Contrast:** Normal, High, Max — all compatible with Light Mode
- **Text Size:** S / M / L / XL — scales only font sizes, layout dimensions stay fixed
- All accessibility preferences persist between sessions

### Help Modal
- Appears automatically on first load
- "Don't show this again" checkbox with localStorage persistence
- Re-openable at any time from Settings → Help
- Covers: what the tool is, design philosophy, suggested beginner workflow, sticky note usage, and practice tips

### Data Persistence
- All form fields auto-save to `localStorage` on input
- Company selection, priority, case/interaction IDs, toggle states, accessibility prefs, and sticky notes all persist
- **Save Draft** manually flushes all fields to storage
- **Clear Interaction** resets the current session without touching other saved data
- **Wipe All Saved Data** clears all `crm_*` localStorage keys and reloads the page

### Light Mode
- Full light mode override via Settings → Appearance
- Compatible with all company themes and contrast levels

### Compact Density
- Reduces padding in panels for a more information-dense layout

---

## Changelog

### v0.4.0 — Accessibility & Timer Improvements
- Added **Accessibility section** to Settings panel with Font, Color Contrast, and Text Size controls
- Text size scaling now uses `rem` units throughout the CSS with `html { font-size }` as the root anchor — only text scales, layout dimensions remain fixed
- Added font options: Lexend and Atkinson Hyperlegible loaded via Google Fonts
- Added High and Max contrast modes, both compatible with Light Mode
- Replaced two-button (Start / Stop) call timer with a **single toggle button** that switches between ▶ START and ■ STOP
- Replaced ACW text input with a **live ACW count-up timer** (MM:SS) — starts automatically on Save & Close, with manual toggle and reset controls
- All accessibility preferences persist to localStorage

### v0.3.0 — Settings Overhaul & Help Modal
- Added **welcome/help modal** that appears on first load with design philosophy, beginner workflow steps, and practice tips
- Added "Don't show this again" preference saved to localStorage
- Added **master toggle** in Settings to show/hide all panels and features at once
- Added **group toggles** for Left Column, Centre & Right, and Features sections
- Group and master toggles stay bidirectionally in sync with individual child toggles
- Added Help section to Settings panel with re-open button
- All toggle states now persist between sessions

### v0.2.0 — File Separation & Structure
- Split the original single-file HTML into three separate files: `index.html`, `crm-simulator.css`, `crm-simulator.js`
- CSS organised into clearly labelled sections with comment banners
- JS organised with section headers for each logical area
- Script loaded at end of `<body>` to ensure DOM is available before execution
- No functional changes from v0.1.0

### v0.1.0 — Initial Build
- Four company themes: Generic Company, PB Tech, JB Hi-Fi, Harvey Norman — each with accent colour, agent ID, queue, and outage banner
- Full three-column CRM layout: Caller Identity, Account Status, Customer Flags, Case/Ticket, Quick Actions, Interaction History
- 11 Quick Action buttons with toast notification feedback
- Wrap-up bar with disposition code and survey consent dropdowns
- Call timer (HH:MM:SS) with Start, Stop, and Reset
- Draggable sticky notes with five colour options and customer detail template
- Full localStorage persistence for all form fields, toggles, notes, and preferences
- Company switcher in both top bar tabs and Settings panel
- Light mode and compact density toggles
- Settings panel with individual panel toggles, data management buttons, and slide-in animation

---

## Project Structure

```
CRM simulator/
├── index.html          — Markup: layout, modals, settings panel, all HTML structure
├── crm-simulator.css   — Styles: design tokens, themes, components, accessibility
└── crm-simulator.js    — Logic: timers, persistence, toggles, sticky notes, company switching
```

---

## Notes

This tool is intended for **training and practice only**. It has no backend, no authentication, and no network requests beyond loading Google Fonts. All data lives in your browser and never leaves your device.
