package main

import (
	"time"

	"gorm.io/gorm"
)

// User 用户模型
type User struct {
	ID        uint           `json:"id" gorm:"primarykey"`
	Username  string         `json:"username" gorm:"unique;not null"`
	Email     string         `json:"email" gorm:"unique;not null"`
	Password  string         `json:"-" gorm:"not null"` // 密码不会在JSON中显示
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联的食物记录
	FoodRecords []FoodRecord `json:"food_records,omitempty"`
}

// FoodRecord 食物记录模型
type FoodRecord struct {
	ID        uint           `json:"id" gorm:"primarykey"`
	UserID    uint           `json:"user_id" gorm:"not null"`
	Date      string         `json:"date" gorm:"not null"`                 // 格式: YYYY-MM-DD
	MealType  string         `json:"meal_type" gorm:"not null"`            // 早餐、午餐、晚餐、零食
	FoodItems string         `json:"food_items" gorm:"type:text;not null"` // 食物描述
	Notes     string         `json:"notes" gorm:"type:text"`               // 额外备注
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// 关联用户
	User User `json:"user,omitempty"`
}

// 登录请求结构
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// 注册请求结构
type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// 食物记录请求结构
type FoodRecordRequest struct {
	Date      string `json:"date" binding:"required"`
	MealType  string `json:"meal_type" binding:"required"`
	FoodItems string `json:"food_items" binding:"required"`
	Notes     string `json:"notes"`
}

// API响应结构
type Response struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}
