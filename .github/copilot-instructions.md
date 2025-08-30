# Copilot Instructions: Child Sessions Therapist Desktop App

## Project Architecture

This is a **Wails v2 desktop application** combining Go backend with React TypeScript frontend for therapist session management. The application is designed for local, offline-first operation with planned SQLite database integration.

### Core Structure

- **Go Backend (`app.go`, `main.go`)**: Business logic, data processing, and API methods exposed to frontend
- **React Frontend (`frontend/src/`)**: UI layer using TypeScript, Vite build system
- **Wails Binding**: Auto-generated TypeScript bindings in `frontend/wailsjs/go/` for seamless Go-to-JS communication
- **Embedded Assets**: Frontend built and embedded into Go binary via `//go:embed all:frontend/dist`

## Key Development Patterns

### Backend Go Patterns

- **App Struct**: Single `App` struct with context, all methods exposed via Wails binding
- **Method Exposure**: Public methods on `App` automatically available to frontend (see `Greet` example)
- **Context Usage**: Store `context.Context` from `startup()` for runtime method calls
- **Error Handling**: Return errors from Go methods - they become Promise rejections in TypeScript

### Frontend Integration

- **Generated Bindings**: Never edit `wailsjs/` directory - regenerated on build
- **Import Pattern**: `import {MethodName} from "../wailsjs/go/main/App"`
- **Async Calls**: All Go methods return Promises: `Greet(name).then(updateResultText)`
- **TypeScript Types**: Auto-generated `.d.ts` files provide full type safety

### Development Workflow

```bash
# Live development with hot reload
wails dev

# Production build (creates platform binaries)
wails build

# Frontend-only development (without Go backend)
cd frontend && npm run dev
```

## Project-Specific Context

### Domain Focus

This is a **therapist's toolkit for child sessions** with planned features:

- Session planning and timing
- Activity tracking with SQLite storage
- Quick note-taking with templates
- Auto-formatted session summaries
- PDF export capabilities

### Database Schema (Planned)

- `sessions`: Session management with child_id, timestamps
- `session_activities`: Activity tracking within sessions
- `activities`: Reusable activity templates
- Focus on data encryption for sensitive child information

### UI/UX Considerations

- Child-friendly visual elements (progress bars, timers)
- Therapist efficiency (templates, shortcuts)
- Offline-first design for reliability
- Desktop-native feel with web technologies

## File Organization Conventions

### Go Code

- `main.go`: Wails app initialization and configuration
- `app.go`: All business logic methods (keep this focused and organized)
- Follow Go naming conventions for exported methods (PascalCase)

### React Code

- State management with React zustand
- For validation, use `yup` or similar libraries
- Use functional components with hooks
- Component structure in `src/components/`
- Use TypeScript interfaces for props and state management

### Frontend Code

- `src/App.tsx`: Main React component
- `src/main.tsx`: React app initialization
- use Tailwind CSS and shadcn/ui for styling
- Import Wails methods at component level, not globally

### Configuration

- `wails.json`: Build configuration, frontend commands
- `frontend/package.json`: Node dependencies, separate from Go
- `frontend/vite.config.ts`: Frontend build settings

## Development Tips

### Adding New Go Methods

1. Add public method to `App` struct in `app.go`
2. Use `wails dev` to auto-regenerate TypeScript bindings
3. Import and use in React components with proper error handling

### Database Integration

- Use Go database drivers (planned: SQLite with `github.com/mattn/go-sqlite3`)
- Initialize database in `startup()` method
- Expose CRUD operations as App methods

### Testing Strategy

- Go: Standard `testing` package for backend logic
- Frontend: React Testing Library for component tests
- Integration: Test Wails bindings with actual method calls

### Build and Deployment

- `wails build` creates platform-specific binaries in `build/bin/`
- Configure app metadata in `wails.json`
- Icons and manifests in `build/` directory structure

### Ui Language

- Languague in ui should be Indonesian (see by users)

### General Notes

- Keep Go methods focused on business logic, not UI concerns
- Use TypeScript for frontend state management and UI logic
- Avoid tight coupling between frontend and backend
- Use Wails events for real-time updates (e.g., session state changes)

### Fetch Reference Documentation

- https://wails.io/docs/howdoesitwork
- [Wails Documentation](https://wails.io/docs/)
- https://wails.io/docs/guides/frontend
- https://wails.io/docs/reference/runtime/intro
- https://wails.io/docs/reference/runtime/events
- https://wails.io/docs/reference/runtime/log
- https://wails.io/docs/reference/runtime/window
- https://wails.io/docs/reference/runtime/Dialog
- https://wails.io/docs/reference/runtime/menu
- https://wails.io/docs/reference/runtime/browser
- https://wails.io/docs/reference/runtime/clipboard
- https://wails.io/docs/reference/runtime/screen
- https://wails.io/docs/reference/runtime/draganddrop
- https://wails.io/docs/reference/cli
- https://wails.io/docs/reference/options
- https://wails.io/docs/reference/menus
- https://wails.io/docs/reference/project-config
- https://pkg.go.dev/gorm.io/gorm@v1.30.1#pkg-index
- https://pkg.go.dev/github.com/wailsapp/wails/v2@v2.10.2/pkg/runtime

### Additional Resources

-- https://ui.shadcn.com/docs/theming
-- https://tailwindcss.com/docs/colors

### Scripts frontends

-- Always use Bun for package management and scripts (dont use npm)
