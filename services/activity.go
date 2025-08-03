package services

import (
	"childSessions/model"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type ActivityService struct {
    db *gorm.DB
}

func NewActivityService(db *gorm.DB) *ActivityService {
    return &ActivityService{db: db}
}

// GetAllActivities retrieves all activities
func (s *ActivityService) GetAllActivities() ([]model.Activity, error) {
    var activities []model.Activity
    if err := s.db.Find(&activities).Error; err != nil {
        return nil, fmt.Errorf("gagal mengambil data aktivitas: %w", err)
    }
    return activities, nil
}

// CreateActivity creates a new activity
func (s *ActivityService) CreateActivity(name, description string, defaultDurationMinutes int) (*model.Activity, error) {
    if name == "" {
        return nil, errors.New("nama aktivitas harus diisi")
    }

    activity := &model.Activity{
        Name:                   name,
        Description:            description,
        DefaultDurationMinutes: defaultDurationMinutes,
    }

    if err := s.db.Create(activity).Error; err != nil {
        return nil, fmt.Errorf("gagal membuat aktivitas: %w", err)
    }

    return activity, nil
}

// GetActivityByID retrieves an activity by ID
func (s *ActivityService) GetActivityByID(id uint) (*model.Activity, error) {
    var activity model.Activity
    if err := s.db.First(&activity, id).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("aktivitas tidak ditemukan")
        }
        return nil, fmt.Errorf("gagal mengambil data aktivitas: %w", err)
    }
    return &activity, nil
}