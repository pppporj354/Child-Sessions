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
func (s *ActivityService) CreateActivity(name, description string, defaultDurationMinutes int, category, objectives string) (*model.Activity, error) {
    activity := &model.Activity{
        Name:                   name,
        Description:            description,
        DefaultDurationMinutes: defaultDurationMinutes,
        Category:               category,
        Objectives:             objectives,
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

// UpdateActivity updates an existing activity
func (s *ActivityService) UpdateActivity(id uint, name, description string, defaultDurationMinutes int, category, objectives string) (*model.Activity, error) {
    var activity model.Activity
    if err := s.db.First(&activity, id).Error; err != nil {
        return nil, fmt.Errorf("aktivitas tidak ditemukan: %w", err)
    }
    activity.Name = name
    activity.Description = description
    activity.DefaultDurationMinutes = defaultDurationMinutes
    activity.Category = category
    activity.Objectives = objectives

    if err := s.db.Save(&activity).Error; err != nil {
        return nil, fmt.Errorf("gagal memperbarui aktivitas: %w", err)
    }
    return &activity, nil
}

// DeleteActivity deletes an activity
func (s *ActivityService) DeleteActivity(id uint) error {
    if err := s.db.Delete(&model.Activity{}, id).Error; err != nil {
        return fmt.Errorf("gagal menghapus aktivitas: %w", err)
    }
    return nil
}