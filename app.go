package main

import (
	"childSessions/db"
	"childSessions/model"
	"childSessions/services"
	"context"
	"fmt"
	"time"

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
	return a.childService.CreateChild(name, gender, parentGuardianName, contactInfo, initialAssessment, dobPtr)
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
	return a.sessionService.StartSession(childID)
}

// EndSession concludes an active session with summary notes
func (a *App) EndSession(sessionID uint, summaryNotes string) (*model.Session, error) {
	return a.sessionService.EndSession(sessionID, summaryNotes)
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

// CreateActivity creates a new therapy activity
func (a *App) CreateActivity(name, description string, defaultDurationMinutes int) (*model.Activity, error) {
	return a.activityService.CreateActivity(name, description, defaultDurationMinutes)
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
	if err := a.database.Find(&templates).Error; err != nil {
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

	return reward, nil
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
