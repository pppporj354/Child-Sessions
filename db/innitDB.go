package db

import (
	"childSessions/model"
	"log"
	"os"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// InitDB initializes the database connection and runs migrations
func InitDB(dbPath string) (*gorm.DB, error) {
	// Configure GORM logger for better debugging
	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags), // io writer
		logger.Config{
			SlowThreshold:             time.Second,   // Slow SQL threshold
			LogLevel:                  logger.Silent, // Log level
			IgnoreRecordNotFoundError: true,          // Ignore ErrRecordNotFound error for logger
			Colorful:                  false,         // Disable color
		},
	)

	
	// Open database connection
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: newLogger,
	})
	if err != nil {
		return nil, err
	}

	if os.Getenv("APP_ENV") != "production" {
        err = RunMigrationsManual(db)
        if err != nil {
            return nil, err
        }
    }

	// Configure SQLite specific settings
	sqlDB, err := db.DB()
	if err == nil {
		// Set connection pool settings
		sqlDB.SetMaxIdleConns(10)
		sqlDB.SetMaxOpenConns(100)
		sqlDB.SetConnMaxLifetime(time.Hour)

		// Enable foreign key constraints for SQLite
		if err := db.Exec("PRAGMA foreign_keys = ON").Error; err != nil {
			log.Printf("Warning: Could not enable foreign key constraints: %v", err)
		}

		// Enable WAL mode for better concurrency
		if err := db.Exec("PRAGMA journal_mode = WAL").Error; err != nil {
			log.Printf("Warning: Could not enable WAL mode: %v", err)
		}
	}

	// Run migrations using the new migration system
	err = RunMigrationsManual(db)
	if err != nil {
		return nil, err
	}

	// Seed initial data if needed
	err = SeedInitialData(db)
	if err != nil {
		return nil, err
	}

	

	return db, nil
}

// RunMigrations runs all database migrations using GORM AutoMigrate
// This is kept for backward compatibility, but RunMigrationsManual is preferred
func RunMigrations(db *gorm.DB) error {
	log.Println("Using legacy AutoMigrate method. Consider using RunMigrationsManual for better control.")

	// Auto-migrate all models in the correct order to handle foreign key constraints
	err := db.AutoMigrate(
		&model.Child{},
		&model.Session{},
		&model.Activity{},
		&model.SessionActivity{},
		&model.Note{},
		&model.NoteTemplate{},
		&model.Reward{},
		&model.Goal{},
		&model.Flashcard{},
		&model.SessionFlashcard{},
	)
	if err != nil {
		return err
	}

	return nil
}


// SeedInitialData seeds the database with initial required data
func SeedInitialData(db *gorm.DB) error {
	// Seed default activities
	var activityCount int64
	db.Model(&model.Activity{}).Count(&activityCount)

	if activityCount == 0 {
		defaultActivities := []model.Activity{
			{
				Name:                   "Terapi Bicara",
				Description:            "Aktivitas terapi bicara untuk meningkatkan kemampuan komunikasi anak",
				DefaultDurationMinutes: 30,
			},
			{
				Name:                   "Terapi Bermain",
				Description:            "Aktivitas bermain terapeutik untuk pengembangan sosial dan emosional",
				DefaultDurationMinutes: 45,
			},
			{
				Name:                   "Latihan Motorik Halus",
				Description:            "Aktivitas untuk meningkatkan kemampuan motorik halus anak",
				DefaultDurationMinutes: 20,
			},
			{
				Name:                   "Latihan Motorik Kasar",
				Description:            "Aktivitas untuk meningkatkan kemampuan motorik kasar anak",
				DefaultDurationMinutes: 30,
			},
			{
				Name:                   "Latihan Konsentrasi",
				Description:            "Aktivitas untuk meningkatkan kemampuan fokus dan konsentrasi",
				DefaultDurationMinutes: 25,
			},
		}

		for _, activity := range defaultActivities {
			if err := db.Create(&activity).Error; err != nil {
				return err
			}
		}
	}

	// Seed default note templates
	var templateCount int64
	db.Model(&model.NoteTemplate{}).Count(&templateCount)

	if templateCount == 0 {
		defaultTemplates := []model.NoteTemplate{
			{
				TemplateText: "Anak menunjukkan antusiasme yang baik terhadap aktivitas",
				CategoryHint: "Positive",
				Keywords:     "antusias,baik,positif",
			},
			{
				TemplateText: "Anak terlihat kesulitan dalam mengikuti instruksi",
				CategoryHint: "Challenge",
				Keywords:     "kesulitan,instruksi,tantangan",
			},
			{
				TemplateText: "Anak berinteraksi dengan baik dengan terapis",
				CategoryHint: "Social",
				Keywords:     "interaksi,terapis,sosial",
			},
			{
				TemplateText: "Anak menunjukkan kemajuan dalam keterampilan motorik",
				CategoryHint: "Progress",
				Keywords:     "kemajuan,motorik,perkembangan",
			},
			{
				TemplateText: "Anak memerlukan bantuan tambahan untuk menyelesaikan tugas",
				CategoryHint: "Support",
				Keywords:     "bantuan,tugas,dukungan",
			},
		}

		for _, template := range defaultTemplates {
			if err := db.Create(&template).Error; err != nil {
				return err
			}
		}
	}

	return nil
}

// GetDBConnection gets the database connection with proper configuration
func GetDBConnection(db *gorm.DB) *gorm.DB {
	// Configure SQLite specific settings
	sqlDB, err := db.DB()
	if err != nil {
		return db
	}

	// Set connection pool settings
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return db
}