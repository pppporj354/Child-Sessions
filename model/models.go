package model

import (
	"time"

	"gorm.io/gorm"
)

// Child represents the 'children' table.
type Child struct {
	gorm.Model // Provides ID, CreatedAt, UpdatedAt, DeletedAt

	Name                string    `gorm:"not null"`
	DateOfBirth         *time.Time
	Gender              string
	ParentGuardianName  string
	ContactInfo         string
	InitialAssessment   string // This field would be encrypted before saving
	Sessions            []Session `gorm:"foreignKey:ChildID"` // One-to-many relationship with Session
	Rewards             []Reward  `gorm:"foreignKey:ChildID"` // One-to-many relationship with Reward
	Goals               []Goal    `gorm:"foreignKey:ChildID"` // One-to-many relationship with Goal
}

// Session represents the 'sessions' table.
type Session struct {
	gorm.Model // Provides ID, CreatedAt, UpdatedAt, DeletedAt

	ChildID          uint `gorm:"not null"`
	Child            Child // Belongs-to relationship with Child
	StartTime        time.Time `gorm:"not null"`
	EndTime          *time.Time
	DurationMinutes  int
	SummaryNotes     string // Auto-formatted summary notes
	Notes            []Note `gorm:"foreignKey:SessionID"` // One-to-many relationship with Note
	SessionActivities []SessionActivity `gorm:"foreignKey:SessionID"` // One-to-many relationship with SessionActivity
	SessionFlashcards []SessionFlashcard `gorm:"foreignKey:SessionID"` // One-to-many relationship with SessionFlashcard
	Rewards          []Reward `gorm:"foreignKey:SessionID"` // One-to-many relationship with Reward (optional)
}

// Activity represents the 'activities' table.
type Activity struct {
	gorm.Model // Provides ID, CreatedAt, UpdatedAt, DeletedAt

	Name                   string `gorm:"not null;unique"`
	Description            string
	DefaultDurationMinutes int
	SessionActivities      []SessionActivity `gorm:"foreignKey:ActivityID"` // One-to-many relationship with SessionActivity
}

// SessionActivity represents the 'session_activities' table,
// linking activities to a specific session.
type SessionActivity struct {
	gorm.Model // Provides ID, CreatedAt, UpdatedAt, DeletedAt

	SessionID uint `gorm:"not null"`
	Session   Session // Belongs-to relationship with Session
	ActivityID uint `gorm:"not null"`
	Activity  Activity // Belongs-to relationship with Activity
	StartTime *time.Time
	EndTime   *time.Time
	Notes     string // Specific notes related to this activity during the session (potentially encrypted)
}

// Note represents the 'notes' table for quick note-taking.
type Note struct {
	gorm.Model // Provides ID, CreatedAt, UpdatedAt, DeletedAt

	SessionID   uint `gorm:"not null"`
	Session     Session // Belongs-to relationship with Session
	NoteText    string `gorm:"not null"` // This field would be encrypted before saving
	Category    string
	Timestamp   time.Time `gorm:"not null"`
	IsEncrypted bool      `gorm:"default:false"` // Flag indicating if note_text is encrypted
}

// NoteTemplate represents the 'note_templates' table for customizable templates.
type NoteTemplate struct {
	gorm.Model // Provides ID, CreatedAt, UpdatedAt, DeletedAt

	TemplateText string `gorm:"not null;unique"`
	CategoryHint string
	Keywords     string // Comma-separated keywords
}

// Reward represents the 'rewards' table.
type Reward struct {
	gorm.Model // Provides ID, CreatedAt, UpdatedAt, DeletedAt

	ChildID   uint `gorm:"not null"`
	Child     Child // Belongs-to relationship with Child
	SessionID *uint // Can be null if reward is given outside a specific session
	Session   Session `gorm:"foreignKey:SessionID"` // Belongs-to relationship with Session (optional)
	Type      string `gorm:"not null"` // e.g., "Star", "Point", "Sticker"
	Value     int    `gorm:"default:1"`
	Timestamp time.Time `gorm:"not null"`
	Notes     string
}

// Goal represents the 'goals' table for tracking therapy goals.
type Goal struct {
	gorm.Model // Provides ID, CreatedAt, UpdatedAt, DeletedAt

	ChildID      uint `gorm:"not null"`
	Child        Child // Belongs-to relationship with Child
	Name         string `gorm:"not null"`
	Description  string
	TargetValue  int
	TargetType   string    // e.g., "stickers", "sessions_without_tantrum"
	StartDate    time.Time `gorm:"not null"`
	EndDate      *time.Time
	IsAchieved   bool      `gorm:"default:false"`
	AchievedDate *time.Time
}

// Flashcard represents the 'flashcards' table.
type Flashcard struct {
	gorm.Model // Provides ID, CreatedAt, UpdatedAt, DeletedAt

	Category          string `gorm:"not null"`
	TextContent       string
	ImagePath         string
	Description       string
	SessionFlashcards []SessionFlashcard `gorm:"foreignKey:FlashcardID"` // One-to-many relationship with SessionFlashcard
}

// SessionFlashcard represents the 'session_flashcards' table,
// logging flashcard usage within a session.
type SessionFlashcard struct {
	gorm.Model // Provides ID, CreatedAt, UpdatedAt, DeletedAt

	SessionID    uint `gorm:"not null"`
	Session      Session // Belongs-to relationship with Session
	FlashcardID  uint `gorm:"not null"`
	Flashcard    Flashcard // Belongs-to relationship with Flashcard
	ResponseTag  string    // e.g., "Correct", "Incorrect", "Discussed", "Avoided"
	ResponseNotes string
	Timestamp    time.Time `gorm:"not null"`
}

