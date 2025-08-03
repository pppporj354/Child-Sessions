package db

import (
	"childSessions/model"
	"fmt"
	"log"

	"gorm.io/gorm"
)

// MigrationInfo holds information about each migration
type MigrationInfo struct {
    Version     string
    Description string
    Up          func(*gorm.DB) error
    Down        func(*gorm.DB) error
}

// Migration represents a database migration record
type Migration struct {
    ID          uint   `gorm:"primaryKey"`
    Version     string `gorm:"uniqueIndex;not null"`
    Description string
    AppliedAt   int64  `gorm:"autoCreateTime"`
}

// GetAllMigrations returns all available migrations in order
func GetAllMigrations() []MigrationInfo {
    return []MigrationInfo{
        {
            Version:     "001_create_base_tables",
            Description: "Create base tables for children, sessions, activities",
            Up:          migration001Up,
            Down:        migration001Down,
        },
        {
            Version:     "002_create_notes_and_templates",
            Description: "Create notes and note templates tables",
            Up:          migration002Up,
            Down:        migration002Down,
        },
        {
            Version:     "003_create_rewards_and_goals",
            Description: "Create rewards and goals tables",
            Up:          migration003Up,
            Down:        migration003Down,
        },
        {
            Version:     "004_create_flashcards",
            Description: "Create flashcards and session flashcards tables",
            Up:          migration004Up,
            Down:        migration004Down,
        },
        {
            Version:     "005_add_indexes_and_constraints",
            Description: "Add database indexes and constraints for performance",
            Up:          migration005Up,
            Down:        migration005Down,
        },
    }
}

// RunMigrationsManual runs migrations manually with version control
func RunMigrationsManual(db *gorm.DB) error {
    // Create migrations table if it doesn't exist
    if err := db.AutoMigrate(&Migration{}); err != nil {
        return fmt.Errorf("failed to create migrations table: %w", err)
    }

    migrations := GetAllMigrations()
    
    for _, migration := range migrations {
        // Check if migration already applied
        var existingMigration Migration
        result := db.Where("version = ?", migration.Version).First(&existingMigration)
        
        if result.Error == nil {
            log.Printf("Migration %s already applied, skipping", migration.Version)
            continue
        }

        log.Printf("Running migration: %s - %s", migration.Version, migration.Description)
        
        // Run the migration
        if err := migration.Up(db); err != nil {
            return fmt.Errorf("failed to run migration %s: %w", migration.Version, err)
        }

        // Record the migration
        migrationRecord := Migration{
            Version:     migration.Version,
            Description: migration.Description,
        }
        if err := db.Create(&migrationRecord).Error; err != nil {
            return fmt.Errorf("failed to record migration %s: %w", migration.Version, err)
        }

        log.Printf("Migration %s completed successfully", migration.Version)
    }

    return nil
}

// RollbackMigration rolls back a specific migration
func RollbackMigration(db *gorm.DB, version string) error {
    migrations := GetAllMigrations()
    
    var targetMigration *MigrationInfo
    for _, migration := range migrations {
        if migration.Version == version {
            targetMigration = &migration
            break
        }
    }

    if targetMigration == nil {
        return fmt.Errorf("migration %s not found", version)
    }

    // Check if migration was applied
    var existingMigration Migration
    result := db.Where("version = ?", version).First(&existingMigration)
    if result.Error != nil {
        return fmt.Errorf("migration %s was not applied", version)
    }

    log.Printf("Rolling back migration: %s - %s", targetMigration.Version, targetMigration.Description)

    // Run the rollback
    if err := targetMigration.Down(db); err != nil {
        return fmt.Errorf("failed to rollback migration %s: %w", version, err)
    }

    // Remove the migration record
    if err := db.Delete(&existingMigration).Error; err != nil {
        return fmt.Errorf("failed to remove migration record %s: %w", version, err)
    }

    log.Printf("Migration %s rolled back successfully", version)
    return nil
}

// Migration 001: Create base tables
func migration001Up(db *gorm.DB) error {
    // Create children table
    if err := db.AutoMigrate(&model.Child{}); err != nil {
        return err
    }

    // Create sessions table
    if err := db.AutoMigrate(&model.Session{}); err != nil {
        return err
    }

    // Create activities table
    if err := db.AutoMigrate(&model.Activity{}); err != nil {
        return err
    }

    // Create session_activities table
    if err := db.AutoMigrate(&model.SessionActivity{}); err != nil {
        return err
    }

    return nil
}

func migration001Down(db *gorm.DB) error {
    // Drop tables in reverse order to handle foreign key constraints
    if err := db.Migrator().DropTable(&model.SessionActivity{}); err != nil {
        return err
    }
    if err := db.Migrator().DropTable(&model.Activity{}); err != nil {
        return err
    }
    if err := db.Migrator().DropTable(&model.Session{}); err != nil {
        return err
    }
    if err := db.Migrator().DropTable(&model.Child{}); err != nil {
        return err
    }
    return nil
}

// Migration 002: Create notes and templates
func migration002Up(db *gorm.DB) error {
    // Create notes table
    if err := db.AutoMigrate(&model.Note{}); err != nil {
        return err
    }

    // Create note_templates table
    if err := db.AutoMigrate(&model.NoteTemplate{}); err != nil {
        return err
    }

    return nil
}

func migration002Down(db *gorm.DB) error {
    if err := db.Migrator().DropTable(&model.Note{}); err != nil {
        return err
    }
    if err := db.Migrator().DropTable(&model.NoteTemplate{}); err != nil {
        return err
    }
    return nil
}

// Migration 003: Create rewards and goals
func migration003Up(db *gorm.DB) error {
    // Create rewards table
    if err := db.AutoMigrate(&model.Reward{}); err != nil {
        return err
    }

    // Create goals table
    if err := db.AutoMigrate(&model.Goal{}); err != nil {
        return err
    }

    return nil
}

func migration003Down(db *gorm.DB) error {
    if err := db.Migrator().DropTable(&model.Reward{}); err != nil {
        return err
    }
    if err := db.Migrator().DropTable(&model.Goal{}); err != nil {
        return err
    }
    return nil
}

// Migration 004: Create flashcards
func migration004Up(db *gorm.DB) error {
    // Create flashcards table
    if err := db.AutoMigrate(&model.Flashcard{}); err != nil {
        return err
    }

    // Create session_flashcards table
    if err := db.AutoMigrate(&model.SessionFlashcard{}); err != nil {
        return err
    }

    return nil
}

func migration004Down(db *gorm.DB) error {
    if err := db.Migrator().DropTable(&model.SessionFlashcard{}); err != nil {
        return err
    }
    if err := db.Migrator().DropTable(&model.Flashcard{}); err != nil {
        return err
    }
    return nil
}

// Migration 005: Add indexes and constraints
func migration005Up(db *gorm.DB) error {
    // Add indexes for better performance
    
    // Children table indexes
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_children_name ON children(name)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_children_deleted_at ON children(deleted_at)").Error; err != nil {
        return err
    }

    // Sessions table indexes
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_sessions_child_id ON sessions(child_id)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_sessions_deleted_at ON sessions(deleted_at)").Error; err != nil {
        return err
    }

    // Activities table indexes
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_activities_name ON activities(name)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_activities_deleted_at ON activities(deleted_at)").Error; err != nil {
        return err
    }

    // SessionActivities table indexes
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_session_activities_session_id ON session_activities(session_id)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_session_activities_activity_id ON session_activities(activity_id)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_session_activities_deleted_at ON session_activities(deleted_at)").Error; err != nil {
        return err
    }

    // Notes table indexes
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_notes_session_id ON notes(session_id)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_notes_timestamp ON notes(timestamp)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at)").Error; err != nil {
        return err
    }

    // Rewards table indexes
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_rewards_child_id ON rewards(child_id)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_rewards_session_id ON rewards(session_id)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_rewards_timestamp ON rewards(timestamp)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_rewards_deleted_at ON rewards(deleted_at)").Error; err != nil {
        return err
    }

    // Goals table indexes
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_goals_child_id ON goals(child_id)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_goals_start_date ON goals(start_date)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_goals_is_achieved ON goals(is_achieved)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_goals_deleted_at ON goals(deleted_at)").Error; err != nil {
        return err
    }

    // Flashcards table indexes
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_flashcards_category ON flashcards(category)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_flashcards_deleted_at ON flashcards(deleted_at)").Error; err != nil {
        return err
    }

    // SessionFlashcards table indexes
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_session_flashcards_session_id ON session_flashcards(session_id)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_session_flashcards_flashcard_id ON session_flashcards(flashcard_id)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_session_flashcards_timestamp ON session_flashcards(timestamp)").Error; err != nil {
        return err
    }
    if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_session_flashcards_deleted_at ON session_flashcards(deleted_at)").Error; err != nil {
        return err
    }

    return nil
}

func migration005Down(db *gorm.DB) error {
    // Drop all indexes created in migration 005
    indexes := []string{
        "idx_children_name",
        "idx_children_deleted_at",
        "idx_sessions_child_id",
        "idx_sessions_start_time",
        "idx_sessions_deleted_at",
        "idx_activities_name",
        "idx_activities_deleted_at",
        "idx_session_activities_session_id",
        "idx_session_activities_activity_id",
        "idx_session_activities_deleted_at",
        "idx_notes_session_id",
        "idx_notes_timestamp",
        "idx_notes_category",
        "idx_notes_deleted_at",
        "idx_rewards_child_id",
        "idx_rewards_session_id",
        "idx_rewards_timestamp",
        "idx_rewards_deleted_at",
        "idx_goals_child_id",
        "idx_goals_start_date",
        "idx_goals_is_achieved",
        "idx_goals_deleted_at",
        "idx_flashcards_category",
        "idx_flashcards_deleted_at",
        "idx_session_flashcards_session_id",
        "idx_session_flashcards_flashcard_id",
        "idx_session_flashcards_timestamp",
        "idx_session_flashcards_deleted_at",
    }

    for _, index := range indexes {
        if err := db.Exec(fmt.Sprintf("DROP INDEX IF EXISTS %s", index)).Error; err != nil {
            return err
        }
    }

    return nil
}