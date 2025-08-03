package services

import (
	"childSessions/model"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type ChildService struct {
    db *gorm.DB
}

func NewChildService(db *gorm.DB) *ChildService {
    return &ChildService{db: db}
}

// CreateChild creates a new child record
func (s *ChildService) CreateChild(name, gender, parentGuardianName, contactInfo, initialAssessment string, dateOfBirth *string) (*model.Child, error) {
    if name == "" {
        return nil, errors.New("nama anak harus diisi")
    }

    child := &model.Child{
        Name:               name,
        Gender:             gender,
        ParentGuardianName: parentGuardianName,
        ContactInfo:        contactInfo,
        InitialAssessment:  initialAssessment,
    }

    // Parse date of birth if provided
    if dateOfBirth != nil && *dateOfBirth != "" {
        // You might want to add proper date parsing here
        // For now, we'll skip the date parsing
    }

    if err := s.db.Create(child).Error; err != nil {
        return nil, fmt.Errorf("gagal membuat data anak: %w", err)
    }

    return child, nil
}

// GetAllChildren retrieves all children
func (s *ChildService) GetAllChildren() ([]model.Child, error) {
    var children []model.Child
    if err := s.db.Find(&children).Error; err != nil {
        return nil, fmt.Errorf("gagal mengambil data anak: %w", err)
    }
    return children, nil
}

// GetChildByID retrieves a child by ID
func (s *ChildService) GetChildByID(id uint) (*model.Child, error) {
    var child model.Child
    if err := s.db.First(&child, id).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("data anak tidak ditemukan")
        }
        return nil, fmt.Errorf("gagal mengambil data anak: %w", err)
    }
    return &child, nil
}

// UpdateChild updates a child record
func (s *ChildService) UpdateChild(id uint, name, gender, parentGuardianName, contactInfo, initialAssessment string) (*model.Child, error) {
    child, err := s.GetChildByID(id)
    if err != nil {
        return nil, err
    }

    child.Name = name
    child.Gender = gender
    child.ParentGuardianName = parentGuardianName
    child.ContactInfo = contactInfo
    child.InitialAssessment = initialAssessment

    if err := s.db.Save(child).Error; err != nil {
        return nil, fmt.Errorf("gagal memperbarui data anak: %w", err)
    }

    return child, nil
}

// DeleteChild soft deletes a child record
func (s *ChildService) DeleteChild(id uint) error {
    if err := s.db.Delete(&model.Child{}, id).Error; err != nil {
        return fmt.Errorf("gagal menghapus data anak: %w", err)
    }
    return nil
}