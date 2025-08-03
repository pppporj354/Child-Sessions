# Therapist's Toolkit for Child Sessions: Go Wails Desktop App

## Core Technologies

- **Go (Backend Logic):** Powerful, concurrent, and ideal for handling data processing, business logic, and interactions with the database.
- **Wails (Frontend/Backend Binding):** Seamlessly bridges your Go backend with a web-based frontend (HTML, CSS, JavaScript, React/Vue/Svelte) for a rich, modern UI.
- **SQLite (Local Database):** Perfect for local, file-based data storage. It's lightweight, robust, and well-supported in Go.
- **Encryption Libraries:** For securing sensitive child data.

---

## Key Features & Implementation Considerations

### 1. 🧠 Session Planner + Timer

**UI/UX:**

- Clear session start/end buttons.
- Dropdown/list for selecting pre-defined activities or adding ad-hoc ones.
- Visually prominent timer for current activity and overall session.
- Progress bar or countdown animation for engaging the child if visible.

**Go Backend Logic:**

- **Session Management:** Functions to `StartSession(childID, activityIDs []string)`, `PauseSession()`, `ResumeSession()`, `EndSession()`.
- **Activity Tracking:** Store `activityID`, `startTime`, `endTime`. Calculate duration.
- **Timers:** Use Go's `time` package and goroutines for concurrent, accurate timing. Send events back to the frontend to update the timer display (Wails supports event emission).
- **Reminders/Alerts:** Implement a simple scheduler (e.g., using `time.AfterFunc` or a dedicated goroutine) to send alerts to the frontend (e.g., "5 minutes left for this activity").

**SQLite Schema:**

- `sessions` table: `id`, `child_id`, `start_time`, `end_time`, `notes` (summary).
- `session_activities` table: `id`, `session_id`, `activity_id`, `start_time`, `end_time`, `notes`.
- `activities` table: `id`, `name`, `description`, `default_duration` (for pre-population).

---

### 2. 📝 Quick Note-Taking & Auto-Formatted Summaries

**UI/UX:**

- Simple text area for notes during the session.
- List of customizable "shortcut templates" (e.g., "Child avoided eye contact," "Engaged well with toy"). Clicking a template appends the text.
- Preview area for the auto-formatted summary.
- "Export as PDF" and "Copy to Clipboard" buttons.

**Go Backend Logic:**

- **Note Storage:** Save raw notes associated with the session and potentially specific activities.
- **Template Management:** Allow therapists to define and store their own templates.
- **Auto-Formatting:**
  - Parse raw notes (e.g., prefixing notes with categories like "Observed:", "Task:").
  - Use Go's `strings` package for keyword detection and categorization. Regular expressions could identify specific patterns.
  - Structure the output (e.g., markdown or a simple text format) for the summary.
- **PDF Generation:** Use a Go PDF library (e.g., `github.com/jung-kurt/gofpdf` or `github.com/johnfercher/maroto`) to render the structured summary into a professional PDF.

**SQLite Schema:**

- `session_notes` table: `id`, `session_id`, `note_text`, `timestamp`, `category` (optional, e.g., "Observed", "Action").
- `note_templates` table: `id`, `template_text`, `keyword` (optional for auto-suggest).

---

### 3. 🌈 Reward Tracker ("Sticker Board")

**UI/UX:**

- Visually appealing grid or board where stickers/stars appear as they are awarded.
- Buttons/icons to award different types of rewards (e.g., "Star," "Smiley Face," "Point").
- Clear display of total rewards earned.
- "Unlock Certificate" button when a goal is met.

**Go Backend Logic:**

- **Reward Storage:** Track rewards for each child, potentially per session.
- **Goal Management:** Define goals (e.g., "Earn 10 stars," "3 sessions without tantrum"). Associate rewards with these goals.
- **Certificate Generation:** When a goal is met, generate a printable PDF certificate (using a Go PDF library, potentially with child's name and achievement).

**SQLite Schema:**

- `rewards` table: `id`, `child_id`, `session_id` (optional), `type` (star, point, sticker), `value` (e.g., 1 point), `timestamp`.
- `goals` table: `id`, `child_id`, `name`, `description`, `target_value` (e.g., 10 stars), `reward_type`, `is_achieved`, `achieved_date`.

---

### 4. 🎴 Flashcard or Emotion Chart Delivery

**UI/UX:**

- Large, clear display area for flashcards/emotion charts.
- "Next," "Previous" buttons.
- Option to select different flashcard sets (e.g., "Emotions," "Social Scenarios").
- Quickly "tag" or note the child's response (e.g., radio buttons for "Correct," "Incorrect," "Discussed," or a quick note field).

**Go Backend Logic:**

- **Flashcard Management:** Store flashcard data (`image_path`, `text`, `category`).
- **Session Tracking:** Log which flashcards were shown in a session.
- **Response Tagging:** Store the therapist's input regarding the child's response.

**SQLite Schema:**

- `flashcards` table: `id`, `category`, `image_path`, `text_content`, `description`.
- `session_flashcards` table: `id`, `session_id`, `flashcard_id`, `response_tag` (e.g., "correct", "incorrect", "discussed"), `notes`.

---

### 5. 📊 Progress Overview per Child

**UI/UX:**

- Dedicated "Child Dashboard" screen.
- Visually appealing charts (e.g., line charts for trends, bar charts for session counts).
- List of past sessions with clickable links to view detailed notes.
- Summary statistics (total sessions, average engagement, etc.).

**Go Backend Logic:**

- **Data Aggregation:** Query SQLite to gather relevant data for charting.
- **Trend Analysis:** Simple counting of keywords in notes (e.g., occurrences of "agitated" vs. "calm" over time).
- **Report Generation:** Logic to compile periodic summaries.
- **Charting Data:** Prepare data in a format suitable for a frontend charting library (e.g., JSON arrays). Wails can pass this data directly to the frontend.

**SQLite Schema:**  
Leverages existing tables; queries across `sessions`, `session_notes`, `rewards` tables.

---

### 6. 🔒 Local Data Storage with Encryption

**Go Backend Logic:**

- **SQLite Integration:** Use the `database/sql` package with the `github.com/mattn/go-sqlite3` driver.
- **Encryption:**
  - **Sensitive Fields:** Encrypt specific sensitive fields in the database (e.g., child's full name, detailed notes, specific behavioral observations) rather than the entire database file.
  - **Go Libraries:**
    - `crypto/aes` and `crypto/cipher` for AES encryption.
    - `golang.org/x/crypto/scrypt` or `golang.org/x/crypto/bcrypt` for key derivation from a passphrase.
    - `github.com/awnumar/memguard` or similar for handling encryption keys in memory securely.
  - **Implementation:** Decrypt data for display, encrypt before storing. Require therapist to enter a master passphrase to unlock encryption.

**SQLite Security:**  
Encrypting sensitive data fields within the database is a common and effective approach for local applications.

---

## General Go Wails Implementation Steps

1. **Project Setup:**
   - `wails init -n "TherapistToolkit" -t "react"` (or vue, svelte, vanilla)
2. **Go Backend (`main.go`, `app.go`, `backend/` packages):**
   - Define your application struct (`App`).
   - Implement Go functions that the frontend will call (e.g., `app.StartSession(childID string)`, `app.SaveNote(note string)`). Wails automatically binds these.
   - Set up your SQLite database connection and schema migration (e.g., using `golang-migrate/migrate`).
   - Implement all the business logic for each feature.
3. **Frontend (React/Vue/Svelte in `frontend/`):**
   - Design your UI components for each feature.
   - Use `window.go.main.App.FunctionName()` to call Go backend functions.
   - Use `runtime.EventsOn()` and `runtime.EventsEmit()` for asynchronous communication (e.g., timer updates, alerts).
   - Integrate a charting library (e.g., Chart.js, Recharts, Nivo) for the progress overview.
4. **Data Models:**  
   Create Go structs for your data entities (`Child`, `Session`, `Activity`, `Note`, `Reward`, `Flashcard`) to ensure type safety and easy data manipulation.
5. **Error Handling:**  
   Implement robust error handling in both the Go backend and the frontend to provide meaningful feedback to the user.
6. **User Authentication (Optional but Recommended):**  
   Even for a local app, a simple password for the therapist to access the app adds a layer of security, especially for accessing the encryption key.

---

## Considerations for a Production-Ready Application

- **User Management:** Even if it's a single user, having a login screen protects the data from unauthorized access on a shared computer.
- **Settings/Configuration:** Allow therapists to customize templates, activity lists, reward thresholds, and notification settings.
- **Backup/Restore:** Provide a feature to back up the encrypted SQLite database file and restore it.
- **Accessibility:** Ensure the UI is usable for therapists with varying needs (e.g., keyboard navigation).
- **Testing:** Thoroughly test all features, especially the automation and data integrity.
- **Installation:** Wails provides easy build commands for creating installers for different OS.
