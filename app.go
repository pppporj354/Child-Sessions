package main

import (
	"childSessions/db"
	"childSessions/model"
	"childSessions/services"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	sysruntime "runtime"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"gorm.io/gorm"
)

// App struct
type App struct {
	ctx             context.Context
	childService    *services.ChildService
	sessionService  *services.SessionService
	activityService *services.ActivityService
	noteService     *services.NoteService      
	rewardService   *services.RewardService    
	database        *gorm.DB
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize database
	database, err := db.InitDB("therapy_sessions.db")
	if err != nil {
		panic(fmt.Sprintf("Failed to initialize database: %v", err))
	}

	a.database = database

	// Initialize services
	a.childService = services.NewChildService(database)
	a.sessionService = services.NewSessionService(database)
	a.activityService = services.NewActivityService(database)
	a.noteService = services.NewNoteService(database)     
	a.rewardService = services.NewRewardService(database) 
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// ===== CHILD MANAGEMENT METHODS =====

// GetAllChildren retrieves all children for the therapist
func (a *App) GetAllChildren() ([]model.Child, error) {
	return a.childService.GetAllChildren()
}

// CreateChild creates a new child record
func (a *App) CreateChild(name, gender, parentGuardianName, contactInfo, initialAssessment, dateOfBirth string) (*model.Child, error) {
    var dobPtr *string
    if dateOfBirth != "" {
        dobPtr = &dateOfBirth
    }
    child, err := a.childService.CreateChild(name, gender, parentGuardianName, contactInfo, initialAssessment, dobPtr)
    if err != nil {
        return nil, err
    }

    // Emit child added event for dashboard/frontend updates
    runtime.EventsEmit(a.ctx, "child_added", map[string]interface{}{
        "child_id": child.ID,
        "name":     child.Name,
        "gender":   child.Gender,
        "timestamp": time.Now(),
    })

    return child, nil
}

// GetChildByID retrieves a specific child by ID
func (a *App) GetChildByID(id uint) (*model.Child, error) {
	return a.childService.GetChildByID(id)
}

// UpdateChild updates a child's information
func (a *App) UpdateChild(id uint, name, gender, parentGuardianName, contactInfo, initialAssessment string) (*model.Child, error) {
	return a.childService.UpdateChild(id, name, gender, parentGuardianName, contactInfo, initialAssessment)
}

// DeleteChild removes a child record (soft delete)
func (a *App) DeleteChild(id uint) error {
	return a.childService.DeleteChild(id)
}

// ===== SESSION MANAGEMENT METHODS =====

// StartSession begins a new therapy session for a child
func (a *App) StartSession(childID uint) (*model.Session, error) {
    fmt.Printf("Starting session for child ID: %d\n", childID)
    
    session, err := a.sessionService.StartSession(childID)
    if err != nil {
        fmt.Printf("Error starting session: %v\n", err)
        return nil, err
    }
    
    // Emit session started event
    runtime.EventsEmit(a.ctx, "session_started", map[string]interface{}{
        "session_id": session.ID,
        "child_id":   session.ChildID,
        "start_time": session.StartTime,
    })
    // Also emit a generic session update for consumers listening to aggregate updates
    runtime.EventsEmit(a.ctx, "session_updated", map[string]interface{}{
        "session_id": session.ID,
        "child_id":   session.ChildID,
        "change":     "started",
        "timestamp":  time.Now(),
    })
    
    fmt.Printf("Session started successfully. ID: %d\n", session.ID)
    return session, nil
}

// EndSession concludes an active session with summary notes
func (a *App) EndSession(sessionID uint, summaryNotes string) (*model.Session, error) {
    session, err := a.sessionService.EndSession(sessionID, summaryNotes)
    if err != nil {
        return nil, err
    }
    
    // Emit session ended event
    runtime.EventsEmit(a.ctx, "session_ended", map[string]interface{}{
        "session_id":    session.ID,
        "child_id":      session.ChildID,
        "end_time":      session.EndTime,
        "duration":      session.DurationMinutes,
    })
    // Also emit a generic session update for active listeners
    runtime.EventsEmit(a.ctx, "session_updated", map[string]interface{}{
        "session_id": session.ID,
        "child_id":   session.ChildID,
        "change":     "ended",
        "timestamp":  time.Now(),
    })
    
    return session, nil
}

// GetActiveSession retrieves the currently active session for a child
func (a *App) GetActiveSession(childID uint) (*model.Session, error) {
	return a.sessionService.GetActiveSession(childID)
}

// GetSessionsByChild retrieves all sessions for a specific child
func (a *App) GetSessionsByChild(childID uint) ([]model.Session, error) {
	return a.sessionService.GetSessionsByChild(childID)
}

// GetSessionByID retrieves detailed session information by ID
func (a *App) GetSessionByID(sessionID uint) (*model.Session, error) {
	return a.sessionService.GetSessionByID(sessionID)
}

// ===== ACTIVITY MANAGEMENT METHODS =====

// GetAllActivities retrieves all available therapy activities
func (a *App) GetAllActivities() ([]model.Activity, error) {
	return a.activityService.GetAllActivities()
}

// UpdateActivity updates an existing activity
func (a *App) UpdateActivity(id uint, name, description string, defaultDurationMinutes int, category, objectives string) (*model.Activity, error) {
    return a.activityService.UpdateActivity(id, name, description, defaultDurationMinutes, category, objectives)
}

// DeleteActivity deletes an activity
func (a *App) DeleteActivity(id uint) error {
    return a.activityService.DeleteActivity(id)
}

// CreateActivity creates a new therapy activity
func (a *App) CreateActivity(name, description string, defaultDurationMinutes int, category, objectives string) (*model.Activity, error) {
	return a.activityService.CreateActivity(name, description, defaultDurationMinutes, category, objectives)
}

// GetActivityByID retrieves a specific activity by ID
func (a *App) GetActivityByID(id uint) (*model.Activity, error) {
	return a.activityService.GetActivityByID(id)
}

// ===== SESSION ACTIVITY MANAGEMENT =====

// StartActivityInSession begins an activity within a session
func (a *App) StartActivityInSession(sessionID, activityID uint, notes string) (*model.SessionActivity, error) {
	sessionActivity := &model.SessionActivity{
		SessionID:  sessionID,
		ActivityID: activityID,
		StartTime:  &time.Time{},
		Notes:      notes,
	}
	now := time.Now()
	sessionActivity.StartTime = &now

	if err := a.database.Create(sessionActivity).Error; err != nil {
		return nil, fmt.Errorf("gagal memulai aktivitas dalam sesi: %w", err)
	}

	// Load relationships
	if err := a.database.Preload("Session").Preload("Activity").First(sessionActivity, sessionActivity.ID).Error; err != nil {
		return nil, fmt.Errorf("gagal memuat data aktivitas sesi: %w", err)
	}

    // Emit activity + session updates for real-time frontend listeners
    runtime.EventsEmit(a.ctx, "activity_updated", map[string]interface{}{
        "session_id":           sessionID,
        "activity_id":          sessionActivity.ActivityID,
        "session_activity_id":  sessionActivity.ID,
        "action":               "started",
        "timestamp":            time.Now(),
    })
    runtime.EventsEmit(a.ctx, "session_updated", map[string]interface{}{
        "session_id": sessionID,
        "change":     "activity_started",
        "timestamp":  time.Now(),
    })

	return sessionActivity, nil
}

// EndActivityInSession concludes an activity within a session
func (a *App) EndActivityInSession(sessionActivityID uint, notes string) (*model.SessionActivity, error) {
	var sessionActivity model.SessionActivity
	if err := a.database.First(&sessionActivity, sessionActivityID).Error; err != nil {
		return nil, fmt.Errorf("aktivitas sesi tidak ditemukan: %w", err)
	}

	if sessionActivity.EndTime != nil {
		return nil, fmt.Errorf("aktivitas sudah berakhir")
	}

	now := time.Now()
	sessionActivity.EndTime = &now
	sessionActivity.Notes = notes

	if err := a.database.Save(&sessionActivity).Error; err != nil {
		return nil, fmt.Errorf("gagal mengakhiri aktivitas: %w", err)
	}

    // Emit activity + session updates
    runtime.EventsEmit(a.ctx, "activity_updated", map[string]interface{}{
        "session_id":           sessionActivity.SessionID,
        "activity_id":          sessionActivity.ActivityID,
        "session_activity_id":  sessionActivity.ID,
        "action":               "ended",
        "timestamp":            time.Now(),
    })
    runtime.EventsEmit(a.ctx, "session_updated", map[string]interface{}{
        "session_id": sessionActivity.SessionID,
        "change":     "activity_ended",
        "timestamp":  time.Now(),
    })

	return &sessionActivity, nil
}

// GetSessionActivities retrieves all activities for a specific session
func (a *App) GetSessionActivities(sessionID uint) ([]model.SessionActivity, error) {
	var sessionActivities []model.SessionActivity
	if err := a.database.Preload("Activity").Where("session_id = ?", sessionID).Find(&sessionActivities).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil aktivitas sesi: %w", err)
	}
	return sessionActivities, nil
}

// UpdateActivityInSession updates notes for an ongoing activity
func (a *App) UpdateActivityInSession(sessionActivityID uint, notes string) (*model.SessionActivity, error) {
    var sessionActivity model.SessionActivity
    if err := a.database.First(&sessionActivity, sessionActivityID).Error; err != nil {
        return nil, fmt.Errorf("aktivitas sesi tidak ditemukan: %w", err)
    }

    sessionActivity.Notes = notes

    if err := a.database.Save(&sessionActivity).Error; err != nil {
        return nil, fmt.Errorf("gagal memperbarui catatan aktivitas: %w", err)
    }

    // Load relationships
    if err := a.database.Preload("Activity").Preload("Session").First(&sessionActivity, sessionActivity.ID).Error; err != nil {
        return nil, fmt.Errorf("gagal memuat data aktivitas sesi: %w", err)
    }

    // Emit activity + session updates
    runtime.EventsEmit(a.ctx, "activity_updated", map[string]interface{}{
        "session_id":           sessionActivity.SessionID,
        "activity_id":          sessionActivity.ActivityID,
        "session_activity_id":  sessionActivity.ID,
        "action":               "notes_updated",
        "timestamp":            time.Now(),
    })
    runtime.EventsEmit(a.ctx, "session_updated", map[string]interface{}{
        "session_id": sessionActivity.SessionID,
        "change":     "activity_notes_updated",
        "timestamp":  time.Now(),
    })

    return &sessionActivity, nil
}

// GetActiveActivitiesInSession retrieves currently running activities in a session
func (a *App) GetActiveActivitiesInSession(sessionID uint) ([]model.SessionActivity, error) {
    var sessionActivities []model.SessionActivity
    if err := a.database.Preload("Activity").Where("session_id = ? AND end_time IS NULL", sessionID).Find(&sessionActivities).Error; err != nil {
        return nil, fmt.Errorf("gagal mengambil aktivitas aktif: %w", err)
    }
    return sessionActivities, nil
}

// ===== NOTE MANAGEMENT =====

// AddNote adds a quick note to a session
func (a *App) AddNote(sessionID uint, noteText, category string) (*model.Note, error) {
	if noteText == "" {
		return nil, fmt.Errorf("teks catatan harus diisi")
	}

	note := &model.Note{
		SessionID: sessionID,
		NoteText:  noteText,
		Category:  category,
		Timestamp: time.Now(),
	}

	if err := a.database.Create(note).Error; err != nil {
		return nil, fmt.Errorf("gagal menyimpan catatan: %w", err)
	}

	return note, nil
}

// GetSessionNotes retrieves all notes for a specific session
func (a *App) GetSessionNotes(sessionID uint) ([]model.Note, error) {
	var notes []model.Note
	if err := a.database.Where("session_id = ?", sessionID).Order("timestamp DESC").Find(&notes).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil catatan sesi: %w", err)
	}
	return notes, nil
}

// GetSessionActivityHistoryByChild returns all session activities for a child
func (a *App) GetSessionActivityHistoryByChild(childID uint) ([]model.SessionActivity, error) {
    return a.sessionService.GetSessionActivityHistoryByChild(childID)
}

// UpdateNote updates an existing note
func (a *App) UpdateNote(noteID uint, noteText, category string) (*model.Note, error) {
	var note model.Note
	if err := a.database.First(&note, noteID).Error; err != nil {
		return nil, fmt.Errorf("catatan tidak ditemukan: %w", err)
	}

	note.NoteText = noteText
	note.Category = category

	if err := a.database.Save(&note).Error; err != nil {
		return nil, fmt.Errorf("gagal memperbarui catatan: %w", err)
	}

	return &note, nil
}

// DeleteNote removes a note
func (a *App) DeleteNote(noteID uint) error {
	if err := a.database.Delete(&model.Note{}, noteID).Error; err != nil {
		return fmt.Errorf("gagal menghapus catatan: %w", err)
	}
	return nil
}

// ===== NOTE TEMPLATE MANAGEMENT =====

// GetAllNoteTemplates retrieves all available note templates
func (a *App) GetAllNoteTemplates() ([]model.NoteTemplate, error) {
    var templates []model.NoteTemplate
    if err := a.database.Order("created_at DESC").Find(&templates).Error; err != nil {
        return nil, fmt.Errorf("gagal mengambil template catatan: %w", err)
    }
    return templates, nil
}

// CreateNoteTemplate creates a new note template
func (a *App) CreateNoteTemplate(templateText, categoryHint, keywords string) (*model.NoteTemplate, error) {
    if templateText == "" {
        return nil, fmt.Errorf("teks template harus diisi")
    }
    template := &model.NoteTemplate{
        TemplateText: templateText,
        CategoryHint: categoryHint,
        Keywords:     keywords,
    }
    if err := a.database.Create(template).Error; err != nil {
        return nil, fmt.Errorf("gagal membuat template: %w", err)
    }
    return template, nil
}

// UpdateNoteTemplate updates an existing note template
func (a *App) UpdateNoteTemplate(templateID uint, templateText, categoryHint, keywords string) (*model.NoteTemplate, error) {
    var template model.NoteTemplate
    if err := a.database.First(&template, templateID).Error; err != nil {
        return nil, fmt.Errorf("template tidak ditemukan: %w", err)
    }
    template.TemplateText = templateText
    template.CategoryHint = categoryHint
    template.Keywords = keywords
    if err := a.database.Save(&template).Error; err != nil {
        return nil, fmt.Errorf("gagal memperbarui template: %w", err)
    }
    return &template, nil
}

// DeleteNoteTemplate deletes a note template
func (a *App) DeleteNoteTemplate(templateID uint) error {
    if err := a.database.Delete(&model.NoteTemplate{}, templateID).Error; err != nil {
        return fmt.Errorf("gagal menghapus template: %w", err)
    }
    return nil
}

// ===== REWARD MANAGEMENT =====

// AddReward gives a reward to a child
func (a *App) AddReward(childID uint, sessionID *uint, rewardType string, value int, notes string) (*model.Reward, error) {
	reward := &model.Reward{
		ChildID:   childID,
		SessionID: sessionID,
		Type:      rewardType,
		Value:     value,
		Timestamp: time.Now(),
		Notes:     notes,
	}

	if err := a.database.Create(reward).Error; err != nil {
		return nil, fmt.Errorf("gagal memberikan reward: %w", err)
	}

	// Load relationships
    if err := a.database.Preload("Child").First(reward, reward.ID).Error; err != nil {
		return nil, fmt.Errorf("gagal memuat data reward: %w", err)
	}
    // Emit reward event for real-time updates
    runtime.EventsEmit(a.ctx, "reward_updated", map[string]interface{}{
        "action":     "added",
        "reward_id":  reward.ID,
        "child_id":   reward.ChildID,
        "session_id": reward.SessionID,
        "type":       reward.Type,
        "value":      reward.Value,
        "timestamp":  reward.Timestamp,
    })
	return reward, nil
}

// DeleteReward removes a reward and emits an update event
func (a *App) DeleteReward(rewardID uint) error {
    // Load reward details first for event payload
    var r model.Reward
    if err := a.database.First(&r, rewardID).Error; err != nil {
        return fmt.Errorf("reward tidak ditemukan: %w", err)
    }

    if err := a.rewardService.DeleteReward(rewardID); err != nil {
        return err
    }

    runtime.EventsEmit(a.ctx, "reward_updated", map[string]interface{}{
        "action":     "deleted",
        "reward_id":  rewardID,
        "child_id":   r.ChildID,
        "session_id": r.SessionID,
        "type":       r.Type,
        "value":      r.Value,
        "timestamp":  time.Now(),
    })
    return nil
}

// GetChildRewards retrieves all rewards for a specific child
func (a *App) GetChildRewards(childID uint) ([]model.Reward, error) {
	var rewards []model.Reward
	if err := a.database.Where("child_id = ?", childID).Order("timestamp DESC").Find(&rewards).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil reward anak: %w", err)
	}
	return rewards, nil
}

// GetRewardSummary gets reward statistics for a child
func (a *App) GetRewardSummary(childID uint) (map[string]interface{}, error) {
	var totalRewards int64
	var rewardsByType map[string]int64

	// Count total rewards
	if err := a.database.Model(&model.Reward{}).Where("child_id = ?", childID).Count(&totalRewards).Error; err != nil {
		return nil, fmt.Errorf("gagal menghitung total reward: %w", err)
	}

	// Count rewards by type
	rows, err := a.database.Model(&model.Reward{}).
		Select("type, COUNT(*) as count").
		Where("child_id = ?", childID).
		Group("type").
		Rows()
	if err != nil {
		return nil, fmt.Errorf("gagal menghitung reward per tipe: %w", err)
	}
	defer rows.Close()

	rewardsByType = make(map[string]int64)
	for rows.Next() {
		var rewardType string
		var count int64
		if err := rows.Scan(&rewardType, &count); err != nil {
			continue
		}
		rewardsByType[rewardType] = count
	}

	summary := map[string]interface{}{
		"total_rewards":    totalRewards,
		"rewards_by_type":  rewardsByType,
		"child_id":         childID,
	}

	return summary, nil
}

// ===== GOAL MANAGEMENT =====

// CreateGoal creates a new therapy goal for a child
func (a *App) CreateGoal(childID uint, name, description string, targetValue int, targetType string) (*model.Goal, error) {
	if name == "" {
		return nil, fmt.Errorf("nama tujuan harus diisi")
	}

	goal := &model.Goal{
		ChildID:     childID,
		Name:        name,
		Description: description,
		TargetValue: targetValue,
		TargetType:  targetType,
		StartDate:   time.Now(),
	}

	if err := a.database.Create(goal).Error; err != nil {
		return nil, fmt.Errorf("gagal membuat tujuan: %w", err)
	}

	return goal, nil
}

// GetChildGoals retrieves all goals for a specific child
func (a *App) GetChildGoals(childID uint) ([]model.Goal, error) {
	var goals []model.Goal
	if err := a.database.Where("child_id = ?", childID).Order("start_date DESC").Find(&goals).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil tujuan anak: %w", err)
	}
	return goals, nil
}

// AchieveGoal marks a goal as achieved
func (a *App) AchieveGoal(goalID uint) (*model.Goal, error) {
	var goal model.Goal
	if err := a.database.First(&goal, goalID).Error; err != nil {
		return nil, fmt.Errorf("tujuan tidak ditemukan: %w", err)
	}

	if goal.IsAchieved {
		return nil, fmt.Errorf("tujuan sudah tercapai")
	}

	now := time.Now()
	goal.IsAchieved = true
	goal.AchievedDate = &now

	if err := a.database.Save(&goal).Error; err != nil {
		return nil, fmt.Errorf("gagal menandai tujuan tercapai: %w", err)
	}

	return &goal, nil
}

// ===== FLASHCARD MANAGEMENT =====

// CreateFlashcard creates a new flashcard
func (a *App) CreateFlashcard(category, textContent, imagePath, description string) (*model.Flashcard, error) {
	if category == "" {
		return nil, fmt.Errorf("kategori flashcard harus diisi")
	}

	flashcard := &model.Flashcard{
		Category:    category,
		TextContent: textContent,
		ImagePath:   imagePath,
		Description: description,
	}

	if err := a.database.Create(flashcard).Error; err != nil {
		return nil, fmt.Errorf("gagal membuat flashcard: %w", err)
	}

	return flashcard, nil
}

// GetFlashcardsByCategory retrieves flashcards by category
func (a *App) GetFlashcardsByCategory(category string) ([]model.Flashcard, error) {
	var flashcards []model.Flashcard
	query := a.database
	if category != "" {
		query = query.Where("category = ?", category)
	}

	if err := query.Find(&flashcards).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil flashcard: %w", err)
	}
	return flashcards, nil
}

// LogFlashcardResponse logs a child's response to a flashcard during a session
func (a *App) LogFlashcardResponse(sessionID, flashcardID uint, responseTag, responseNotes string) (*model.SessionFlashcard, error) {
	sessionFlashcard := &model.SessionFlashcard{
		SessionID:     sessionID,
		FlashcardID:   flashcardID,
		ResponseTag:   responseTag,
		ResponseNotes: responseNotes,
		Timestamp:     time.Now(),
	}

	if err := a.database.Create(sessionFlashcard).Error; err != nil {
		return nil, fmt.Errorf("gagal mencatat respons flashcard: %w", err)
	}

	// Load relationships
	if err := a.database.Preload("Flashcard").First(sessionFlashcard, sessionFlashcard.ID).Error; err != nil {
		return nil, fmt.Errorf("gagal memuat data respons flashcard: %w", err)
	}

	return sessionFlashcard, nil
}

// ===== PROGRESS AND STATISTICS =====

// GetChildProgressSummary provides comprehensive progress summary for a child
func (a *App) GetChildProgressSummary(childID uint) (map[string]interface{}, error) {
	// Get total sessions
	var totalSessions int64
	if err := a.database.Model(&model.Session{}).Where("child_id = ?", childID).Count(&totalSessions).Error; err != nil {
		return nil, fmt.Errorf("gagal menghitung total sesi: %w", err)
	}

	// Get completed sessions (with end time)
	var completedSessions int64
	if err := a.database.Model(&model.Session{}).Where("child_id = ? AND end_time IS NOT NULL", childID).Count(&completedSessions).Error; err != nil {
		return nil, fmt.Errorf("gagal menghitung sesi selesai: %w", err)
	}

	// Get average session duration
	var avgDuration float64
	if err := a.database.Model(&model.Session{}).
		Where("child_id = ? AND end_time IS NOT NULL", childID).
		Select("AVG(duration_minutes)").
		Scan(&avgDuration).Error; err != nil {
		avgDuration = 0
	}

	// Get goals progress
	var totalGoals, achievedGoals int64
	a.database.Model(&model.Goal{}).Where("child_id = ?", childID).Count(&totalGoals)
	a.database.Model(&model.Goal{}).Where("child_id = ? AND is_achieved = ?", childID, true).Count(&achievedGoals)

	// Get reward summary
	rewardSummary, _ := a.GetRewardSummary(childID)

	summary := map[string]interface{}{
		"child_id":            childID,
		"total_sessions":      totalSessions,
		"completed_sessions":  completedSessions,
		"avg_duration":        avgDuration,
		"total_goals":         totalGoals,
		"achieved_goals":      achievedGoals,
		"reward_summary":      rewardSummary,
	}

	return summary, nil
}

// ===== UTILITY METHODS =====

// GetCurrentTime returns current timestamp (useful for frontend)
func (a *App) GetCurrentTime() string {
	return time.Now().Format("2006-01-02 15:04:05")
}

// ValidateSession checks if a session is valid and active
func (a *App) ValidateSession(sessionID uint) (bool, error) {
	var session model.Session
	if err := a.database.First(&session, sessionID).Error; err != nil {
		return false, nil // Session doesn't exist
	}

	// Session is active if it has no end time
	return session.EndTime == nil, nil
}

// GenerateSessionSummary creates an auto-formatted summary of the session
func (a *App) GenerateSessionSummary(sessionID uint) (map[string]interface{}, error) {
    // Get session details
    var session model.Session
    if err := a.database.Preload("Child").Preload("Notes").Preload("SessionActivities.Activity").Preload("Rewards").First(&session, sessionID).Error; err != nil {
        return nil, fmt.Errorf("gagal mengambil data sesi: %w", err)
    }

    // Calculate session duration
    var duration int
    if session.EndTime != nil {
        duration = int(session.EndTime.Sub(session.StartTime).Minutes())
    } else {
        duration = int(time.Since(session.StartTime).Minutes())
    }

    // Count activities by status
    completedActivities := 0
    ongoingActivities := 0
    totalActivitiesDuration := 0
    activitiesSummary := make([]map[string]interface{}, 0)

    for _, activity := range session.SessionActivities {
        activitySummary := map[string]interface{}{
            "name":       activity.Activity.Name,
            "start_time": activity.StartTime,
            "end_time":   activity.EndTime,
            "notes":      activity.Notes,
            "status":     "ongoing",
            "duration":   0,
        }

        if activity.EndTime != nil {
            completedActivities++
            activitySummary["status"] = "completed"
            if activity.StartTime != nil {
                activityDuration := int(activity.EndTime.Sub(*activity.StartTime).Minutes())
                totalActivitiesDuration += activityDuration
                activitySummary["duration"] = activityDuration
            }
        } else {
            ongoingActivities++
            if activity.StartTime != nil {
                currentDuration := int(time.Since(*activity.StartTime).Minutes())
                activitySummary["duration"] = currentDuration
            }
        }

        activitiesSummary = append(activitiesSummary, activitySummary)
    }

    // Categorize notes
    notesByCategory := make(map[string][]model.Note)
    for _, note := range session.Notes {
        category := note.Category
        if category == "" {
            category = "Umum"
        }
        notesByCategory[category] = append(notesByCategory[category], note)
    }

    // Count rewards
    rewardsByType := make(map[string]int)
    totalRewards := 0
    for _, reward := range session.Rewards {
        rewardsByType[reward.Type] += reward.Value
        totalRewards += reward.Value
    }

    // Generate formatted summary text
    summaryText := a.formatSessionSummaryText(session, duration, activitiesSummary, notesByCategory, rewardsByType)

    summary := map[string]interface{}{
        "session_id":               session.ID,
        "child_name":               session.Child.Name,
        "start_time":               session.StartTime,
        "end_time":                 session.EndTime,
        "duration_minutes":         duration,
        "total_activities":         len(session.SessionActivities),
        "completed_activities":     completedActivities,
        "ongoing_activities":       ongoingActivities,
        "total_activities_duration": totalActivitiesDuration,
        "total_notes":              len(session.Notes),
        "notes_by_category":        notesByCategory,
        "total_rewards":            totalRewards,
        "rewards_by_type":          rewardsByType,
        "activities_summary":       activitiesSummary,
        "formatted_summary":        summaryText,
        "summary_notes":            session.SummaryNotes,
        "generated_at":             time.Now(),
    }

    return summary, nil
}

// formatSessionSummaryText creates a formatted text summary
func (a *App) formatSessionSummaryText(session model.Session, duration int, activities []map[string]interface{}, notesByCategory map[string][]model.Note, rewards map[string]int) string {
    var summary strings.Builder
    
	summary.WriteString("RINGKASAN SESI TERAPI\n")
	summary.WriteString("====================\n\n")
    summary.WriteString(fmt.Sprintf("Anak: %s\n", session.Child.Name))
    summary.WriteString(fmt.Sprintf("Tanggal: %s\n", session.StartTime.Format("02 January 2006")))
    summary.WriteString(fmt.Sprintf("Waktu: %s", session.StartTime.Format("15:04")))
    
    if session.EndTime != nil {
        summary.WriteString(fmt.Sprintf(" - %s\n", session.EndTime.Format("15:04")))
    } else {
        summary.WriteString(" (Sesi masih berlangsung)\n")
    }
    
    summary.WriteString(fmt.Sprintf("Durasi: %d menit\n\n", duration))

    // Activities section
    if len(activities) > 0 {
        summary.WriteString("AKTIVITAS:\n")
        summary.WriteString("----------\n")
        for _, activity := range activities {
            summary.WriteString(fmt.Sprintf("• %s", activity["name"]))
            if dur, ok := activity["duration"].(int); ok && dur > 0 {
                summary.WriteString(fmt.Sprintf(" (%d menit)", dur))
            }
            if activity["status"] == "completed" {
                summary.WriteString(" ✓")
            } else {
                summary.WriteString(" (berlangsung)")
            }
            summary.WriteString("\n")
            
            if notes, ok := activity["notes"].(string); ok && notes != "" {
                summary.WriteString(fmt.Sprintf("  Catatan: %s\n", notes))
            }
        }
        summary.WriteString("\n")
    }

    // Notes section
    if len(notesByCategory) > 0 {
        summary.WriteString("CATATAN OBSERVASI:\n")
        summary.WriteString("------------------\n")
        for category, notes := range notesByCategory {
            if len(notes) > 0 {
                summary.WriteString(fmt.Sprintf("%s:\n", category))
                for _, note := range notes {
                    summary.WriteString(fmt.Sprintf("• %s\n", note.NoteText))
                }
                summary.WriteString("\n")
            }
        }
    }

    // Rewards section
    if len(rewards) > 0 {
        summary.WriteString("REWARD DIBERIKAN:\n")
        summary.WriteString("-----------------\n")
        for rewardType, count := range rewards {
            summary.WriteString(fmt.Sprintf("• %s: %d\n", rewardType, count))
        }
        summary.WriteString("\n")
    }

    // Summary notes
    if session.SummaryNotes != "" {
        summary.WriteString("CATATAN RINGKASAN:\n")
        summary.WriteString("------------------\n")
        summary.WriteString(session.SummaryNotes)
        summary.WriteString("\n")
    }

    return summary.String()
}

// GetSessionProgress gets real-time session progress
func (a *App) GetSessionProgress(sessionID uint) (map[string]interface{}, error) {
    var session model.Session
    if err := a.database.Preload("Child").Preload("SessionActivities.Activity").First(&session, sessionID).Error; err != nil {
        return nil, fmt.Errorf("sesi tidak ditemukan: %w", err)
    }

    currentTime := time.Now()
    sessionDuration := int(currentTime.Sub(session.StartTime).Minutes())
    
    activeActivitiesCount := 0
    completedActivitiesCount := 0
    totalActivityTime := 0

    for _, activity := range session.SessionActivities {
        if activity.EndTime == nil {
            activeActivitiesCount++
        } else {
            completedActivitiesCount++
            if activity.StartTime != nil {
                totalActivityTime += int(activity.EndTime.Sub(*activity.StartTime).Minutes())
            }
        }
    }

    progress := map[string]interface{}{
        "session_id":                sessionID,
        "child_name":                session.Child.Name,
        "is_active":                 session.EndTime == nil,
        "session_duration_minutes":  sessionDuration,
        "total_activities":          len(session.SessionActivities),
        "active_activities":         activeActivitiesCount,
        "completed_activities":      completedActivitiesCount,
        "total_activity_time":       totalActivityTime,
        "session_start":             session.StartTime,
        "last_updated":              currentTime,
    }

    return progress, nil
}

// UpdateSessionSummaryNotes updates the summary notes for a session
func (a *App) UpdateSessionSummaryNotes(sessionID uint, summaryNotes string) error {
    var session model.Session
    if err := a.database.First(&session, sessionID).Error; err != nil {
        return fmt.Errorf("sesi tidak ditemukan: %w", err)
    }

    session.SummaryNotes = summaryNotes
    
    if err := a.database.Save(&session).Error; err != nil {
        return fmt.Errorf("gagal memperbarui catatan ringkasan: %w", err)
    }

    // Emit session update so UI can refresh summary-related views
    runtime.EventsEmit(a.ctx, "session_updated", map[string]interface{}{
        "session_id": session.ID,
        "change":     "summary_notes_updated",
        "timestamp":  time.Now(),
    })

    return nil
}

// AutoPauseInactiveActivities pauses activities that have been running too long
func (a *App) AutoPauseInactiveActivities(sessionID uint, maxDurationMinutes int) ([]model.SessionActivity, error) {
    cutoffTime := time.Now().Add(-time.Duration(maxDurationMinutes) * time.Minute)
    
    var longRunningActivities []model.SessionActivity
    if err := a.database.Preload("Activity").
        Where("session_id = ? AND end_time IS NULL AND start_time < ?", sessionID, cutoffTime).
        Find(&longRunningActivities).Error; err != nil {
        return nil, fmt.Errorf("gagal mencari aktivitas yang berjalan lama: %w", err)
    }

    var pausedActivities []model.SessionActivity
    now := time.Now()
    
    for _, activity := range longRunningActivities {
        activity.EndTime = &now
        activity.Notes += fmt.Sprintf(" (Dihentikan otomatis setelah %d menit)", maxDurationMinutes)
        
        if err := a.database.Save(&activity).Error; err != nil {
            continue // Skip if error, but continue with others
        }
        
        pausedActivities = append(pausedActivities, activity)
    }

    if len(pausedActivities) > 0 {
        // Emit a single aggregated update to reduce event spam
        ids := make([]uint, 0, len(pausedActivities))
        for _, act := range pausedActivities {
            ids = append(ids, act.ID)
        }
        runtime.EventsEmit(a.ctx, "activity_updated", map[string]interface{}{
            "session_id":          sessionID,
            "session_activity_ids": ids,
            "action":              "auto_paused",
            "count":               len(pausedActivities),
            "timestamp":           time.Now(),
        })
        runtime.EventsEmit(a.ctx, "session_updated", map[string]interface{}{
            "session_id": sessionID,
            "change":     "activities_auto_paused",
            "count":      len(pausedActivities),
            "timestamp":  time.Now(),
        })
    }

    return pausedActivities, nil
}

// GetChildActivityFrequency returns the most frequent activities for a child
func (a *App) GetChildActivityFrequency(childID uint) (map[string]int, error) {
    var results []struct {
        Name  string
        Count int
    }
    err := a.database.
        Table("session_activities").
        Select("activities.name as name, COUNT(*) as count").
        Joins("JOIN activities ON activities.id = session_activities.activity_id").
        Joins("JOIN sessions ON sessions.id = session_activities.session_id").
        Where("sessions.child_id = ?", childID).
        Group("activities.name").
        Order("count DESC").
        Scan(&results).Error
    if err != nil {
        return nil, err
    }
    freq := make(map[string]int)
    for _, r := range results {
        freq[r.Name] = r.Count
    }
    return freq, nil
}

// GetChildNoteKeywordFrequency returns keyword frequency in notes for a child
func (a *App) GetChildNoteKeywordFrequency(childID uint) (map[string]int, error) {
    var notes []string
    err := a.database.
        Table("notes").
        Select("note_text").
        Joins("JOIN sessions ON sessions.id = notes.session_id").
        Where("sessions.child_id = ?", childID).
        Scan(&notes).Error
    if err != nil {
        return nil, err
    }
    // Simple word frequency (split by space, ignore case, remove punctuation)
    freq := make(map[string]int)
    for _, note := range notes {
        words := strings.FieldsFunc(strings.ToLower(note), func(r rune) bool {
            return !((r >= 'a' && r <= 'z') || (r >= '0' && r <= '9'))
        })
        for _, w := range words {
            if len(w) > 2 { // ignore very short words
                freq[w]++
            }
        }
    }
    return freq, nil
}

// GetChildRewardTrends returns reward counts per month for a child
func (a *App) GetChildRewardTrends(childID uint) ([]map[string]interface{}, error) {
    rows, err := a.database.
        Table("rewards").
        Select("strftime('%Y-%m', timestamp) as month, type, SUM(value) as total").
        Where("child_id = ?", childID).
        Group("month, type").
        Order("month ASC").
        Rows()
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    var trends []map[string]interface{}
    for rows.Next() {
        var month, rewardType string
        var total int
        if err := rows.Scan(&month, &rewardType, &total); err != nil {
            continue
        }
        trends = append(trends, map[string]interface{}{
            "month": month,
            "type":  rewardType,
            "total": total,
        })
    }
    return trends, nil
}

// ExportCSVFile exports CSV data to a file using Wails file dialog
func (a *App) ExportCSVFile(csvData string, defaultFilename string) (string, error) {
    // Get user's Downloads directory
    homeDir, err := os.UserHomeDir()
    if err != nil {
        return "", fmt.Errorf("gagal mendapatkan direktori home: %w", err)
    }
    
    downloadsDir := filepath.Join(homeDir, "Downloads")

    // Open save dialog
    filePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
        Title:           "Simpan File CSV",
        DefaultFilename: defaultFilename,
        DefaultDirectory: downloadsDir,
        Filters: []runtime.FileFilter{
            {
                DisplayName: "CSV Files (*.csv)",
                Pattern:     "*.csv",
            },
        },
    })

    if err != nil {
        return "", fmt.Errorf("dialog dibatalkan atau gagal: %w", err)
    }

    if filePath == "" {
        return "", fmt.Errorf("tidak ada file yang dipilih")
    }

    // Write CSV data to file
    err = os.WriteFile(filePath, []byte(csvData), 0644)
    if err != nil {
        return "", fmt.Errorf("gagal menulis file: %w", err)
    }

    return filePath, nil
}

// ExportPDFFile exports PDF data to a file using Wails file dialog
func (a *App) ExportPDFFile(pdfData []byte, defaultFilename string) (string, error) {
    // Get user's Downloads directory
    homeDir, err := os.UserHomeDir()
    if err != nil {
        return "", fmt.Errorf("gagal mendapatkan direktori home: %w", err)
    }
    
    downloadsDir := filepath.Join(homeDir, "Downloads")

    // Open save dialog
    filePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
        Title:           "Simpan File PDF",
        DefaultFilename: defaultFilename,
        DefaultDirectory: downloadsDir,
        Filters: []runtime.FileFilter{
            {
                DisplayName: "PDF Files (*.pdf)",
                Pattern:     "*.pdf",
            },
        },
    })

    if err != nil {
        return "", fmt.Errorf("dialog dibatalkan atau gagal: %w", err)
    }

    if filePath == "" {
        return "", fmt.Errorf("tidak ada file yang dipilih")
    }

    // Write PDF data to file
    err = os.WriteFile(filePath, pdfData, 0644)
    if err != nil {
        return "", fmt.Errorf("gagal menulis file: %w", err)
    }

    return filePath, nil
}

// OpenFileInExplorer opens the file in system file explorer
func (a *App) OpenFileInExplorer(filePath string) error {
    var cmd string
    var args []string

    switch sysruntime.GOOS {
    case "windows":
        cmd = "explorer"
        args = []string{"/select,", filePath}
    case "darwin":
        cmd = "open"
        args = []string{"-R", filePath}
    case "linux":
        // Try different file managers
        if _, err := os.Stat("/usr/bin/nautilus"); err == nil {
            cmd = "nautilus"
            args = []string{"--select", filePath}
        } else if _, err := os.Stat("/usr/bin/dolphin"); err == nil {
            cmd = "dolphin"
            args = []string{"--select", filePath}
        } else {
            // Fallback: open directory
            cmd = "xdg-open"
            args = []string{filepath.Dir(filePath)}
        }
    default:
        return fmt.Errorf("platform tidak didukung")
    }

    exec := exec.Command(cmd, args...)
    return exec.Start()
}

// ShowNotification shows a system notification and emits an event to frontend
func (a *App) ShowNotification(title, message string) error {
    // Emit notification event to frontend
    runtime.EventsEmit(a.ctx, "notification", map[string]interface{}{
        "title":   title,
        "message": message,
        "type":    "success",
    })
    return nil
}

// ShowErrorNotification shows an error notification
func (a *App) ShowErrorNotification(title, message string) {
    runtime.EventsEmit(a.ctx, "notification", map[string]interface{}{
        "title":   title,
        "message": message,
        "type":    "error",
    })
}

// GetActiveSessions returns count of active sessions today
func (a *App) GetActiveSessions() (int64, error) {
    var count int64
    today := time.Now().Format("2006-01-02")
    err := a.database.Model(&model.Session{}).
        Where("DATE(start_time) = ? AND end_time IS NULL", today).
        Count(&count).Error
    if err != nil {
        return 0, fmt.Errorf("gagal menghitung sesi aktif: %w", err)
    }
    return count, nil
}

// GetMostPopularActivity returns the most frequently used activity this month
func (a *App) GetMostPopularActivity() (string, error) {
    var result struct {
        Name  string
        Count int
    }
    
    // Get current month start
    now := time.Now()
    monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
    
    err := a.database.
        Table("session_activities").
        Select("activities.name as name, COUNT(*) as count").
        Joins("JOIN activities ON activities.id = session_activities.activity_id").
        Joins("JOIN sessions ON sessions.id = session_activities.session_id").
        Where("sessions.start_time >= ?", monthStart).
        Group("activities.name").
        Order("count DESC").
        Limit(1).
        Scan(&result).Error
        
    if err != nil {
        return "Tidak ada data", fmt.Errorf("gagal mengambil aktivitas populer: %w", err)
    }
    
    if result.Name == "" {
        return "Tidak ada data", nil
    }
    
    return result.Name, nil
}

// GetTodaySessionsCount returns count of sessions scheduled/started today
func (a *App) GetTodaySessionsCount() (int64, error) {
    var count int64
    today := time.Now().Format("2006-01-02")
    err := a.database.Model(&model.Session{}).
        Where("DATE(start_time) = ?", today).
        Count(&count).Error
    if err != nil {
        return 0, fmt.Errorf("gagal menghitung sesi hari ini: %w", err)
    }
    return count, nil
}

// GetDashboardStats returns comprehensive dashboard statistics
func (a *App) GetDashboardStats() (map[string]interface{}, error) {
    fmt.Println("Getting dashboard stats...")
    
    stats := make(map[string]interface{})
    
    // Get total children count
    var childrenCount int64
    if err := a.database.Model(&model.Child{}).Count(&childrenCount).Error; err != nil {
        fmt.Printf("Error counting children: %v\n", err)
        childrenCount = 0
    }
    
    // Get active sessions count
    activeSessions, err := a.GetActiveSessions()
    if err != nil {
        fmt.Printf("Error getting active sessions: %v\n", err)
        activeSessions = 0
    }
    
    // Get most popular activity
    popularActivity, err := a.GetMostPopularActivity()
    if err != nil {
        fmt.Printf("Error getting popular activity: %v\n", err)
        popularActivity = "Tidak ada data"
    }
    
    // Get today's sessions count
    todaySessions, err := a.GetTodaySessionsCount()
    if err != nil {
        fmt.Printf("Error getting today's sessions: %v\n", err)
        todaySessions = 0
    }
    
    stats["total_children"] = childrenCount
    stats["active_sessions"] = activeSessions
    stats["popular_activity"] = popularActivity
    stats["today_sessions"] = todaySessions
    stats["last_updated"] = time.Now().Format("2006-01-02 15:04:05")
    
    fmt.Printf("Dashboard stats: %+v\n", stats)
    return stats, nil
}

