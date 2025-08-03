package services

import (
	"childSessions/model"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type SessionService struct {
    db *gorm.DB
}

func NewSessionService(db *gorm.DB) *SessionService {
    return &SessionService{db: db}
}

// StartSession creates a new session for a child
func (s *SessionService) StartSession(childID uint) (*model.Session, error) {
    // Check if child exists
    var child model.Child
    if err := s.db.First(&child, childID).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("data anak tidak ditemukan")
        }
        return nil, fmt.Errorf("gagal mengambil data anak: %w", err)
    }

    // Check if there's an active session for this child
    var activeSession model.Session
    err := s.db.Where("child_id = ? AND end_time IS NULL", childID).First(&activeSession).Error
    if err == nil {
        return nil, errors.New("masih ada sesi aktif untuk anak ini")
    }
    if !errors.Is(err, gorm.ErrRecordNotFound) {
        return nil, fmt.Errorf("gagal memeriksa sesi aktif: %w", err)
    }

    session := &model.Session{
        ChildID:   childID,
        StartTime: time.Now(),
    }

    if err := s.db.Create(session).Error; err != nil {
        return nil, fmt.Errorf("gagal membuat sesi: %w", err)
    }

    // Load the child relationship
    if err := s.db.Preload("Child").First(session, session.ID).Error; err != nil {
        return nil, fmt.Errorf("gagal memuat data sesi: %w", err)
    }

    return session, nil
}

// EndSession ends an active session
func (s *SessionService) EndSession(sessionID uint, summaryNotes string) (*model.Session, error) {
    var session model.Session
    if err := s.db.First(&session, sessionID).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("sesi tidak ditemukan")
        }
        return nil, fmt.Errorf("gagal mengambil data sesi: %w", err)
    }

    if session.EndTime != nil {
        return nil, errors.New("sesi sudah berakhir")
    }

    endTime := time.Now()
    session.EndTime = &endTime
    session.DurationMinutes = int(endTime.Sub(session.StartTime).Minutes())
    session.SummaryNotes = summaryNotes

    if err := s.db.Save(&session).Error; err != nil {
        return nil, fmt.Errorf("gagal mengakhiri sesi: %w", err)
    }

    return &session, nil
}

// GetActiveSession gets the active session for a child
func (s *SessionService) GetActiveSession(childID uint) (*model.Session, error) {
    var session model.Session
    err := s.db.Preload("Child").Where("child_id = ? AND end_time IS NULL", childID).First(&session).Error
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, nil // No active session
        }
        return nil, fmt.Errorf("gagal mengambil sesi aktif: %w", err)
    }
    return &session, nil
}

// GetSessionsByChild gets all sessions for a child
func (s *SessionService) GetSessionsByChild(childID uint) ([]model.Session, error) {
    var sessions []model.Session
    if err := s.db.Where("child_id = ?", childID).Order("start_time DESC").Find(&sessions).Error; err != nil {
        return nil, fmt.Errorf("gagal mengambil riwayat sesi: %w", err)
    }
    return sessions, nil
}

// GetSessionByID gets a session by ID
func (s *SessionService) GetSessionByID(sessionID uint) (*model.Session, error) {
    var session model.Session
    if err := s.db.Preload("Child").Preload("Notes").Preload("SessionActivities.Activity").First(&session, sessionID).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("sesi tidak ditemukan")
        }
        return nil, fmt.Errorf("gagal mengambil data sesi: %w", err)
    }
    return &session, nil
}