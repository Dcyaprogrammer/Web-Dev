package main

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// Register 用户注册
func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Status:  "error",
			Message: "请求参数无效: " + err.Error(),
		})
		return
	}

	// 检查用户名是否已存在
	var existingUser User
	if err := DB.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, Response{
			Status:  "error",
			Message: "用户名已存在",
		})
		return
	}

	// 检查邮箱是否已存在
	if err := DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, Response{
			Status:  "error",
			Message: "邮箱已被注册",
		})
		return
	}

	// 加密密码
	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Status:  "error",
			Message: "密码加密失败",
		})
		return
	}

	// 创建用户
	user := User{
		Username: req.Username,
		Email:    req.Email,
		Password: hashedPassword,
	}

	if err := DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Status:  "error",
			Message: "用户创建失败",
		})
		return
	}

	c.JSON(http.StatusCreated, Response{
		Status:  "success",
		Message: "用户注册成功",
		Data: gin.H{
			"user_id":  user.ID,
			"username": user.Username,
			"email":    user.Email,
		},
	})
}

// Login 用户登录
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Status:  "error",
			Message: "请求参数无效: " + err.Error(),
		})
		return
	}

	// 查找用户
	var user User
	if err := DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, Response{
			Status:  "error",
			Message: "用户名或密码错误",
		})
		return
	}

	// 验证密码
	if !CheckPasswordHash(req.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, Response{
			Status:  "error",
			Message: "用户名或密码错误",
		})
		return
	}

	// 生成JWT令牌
	token, err := GenerateToken(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Status:  "error",
			Message: "令牌生成失败",
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Status:  "success",
		Message: "登录成功",
		Data: gin.H{
			"token":    token,
			"user_id":  user.ID,
			"username": user.Username,
			"email":    user.Email,
		},
	})
}

// CreateFoodRecord 创建食物记录
func CreateFoodRecord(c *gin.Context) {
	var req FoodRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Status:  "error",
			Message: "请求参数无效: " + err.Error(),
		})
		return
	}

	userID, _ := c.Get("user_id")

	foodRecord := FoodRecord{
		UserID:    userID.(uint),
		Date:      req.Date,
		MealType:  req.MealType,
		FoodItems: req.FoodItems,
		Notes:     req.Notes,
	}

	if err := DB.Create(&foodRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Status:  "error",
			Message: "食物记录创建失败",
		})
		return
	}

	c.JSON(http.StatusCreated, Response{
		Status:  "success",
		Message: "食物记录创建成功",
		Data:    foodRecord,
	})
}

// GetFoodRecords 获取用户的食物记录
func GetFoodRecords(c *gin.Context) {
	userID, _ := c.Get("user_id")

	// 获取查询参数
	month := c.Query("month") // 格式: YYYY-MM
	date := c.Query("date")   // 格式: YYYY-MM-DD

	var foodRecords []FoodRecord
	query := DB.Where("user_id = ?", userID.(uint))

	if date != "" {
		query = query.Where("date = ?", date)
	} else if month != "" {
		query = query.Where("date LIKE ?", month+"%")
	}

	if err := query.Order("date DESC, created_at DESC").Find(&foodRecords).Error; err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Status:  "error",
			Message: "获取食物记录失败",
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Status:  "success",
		Message: "获取食物记录成功",
		Data:    foodRecords,
	})
}

// UpdateFoodRecord 更新食物记录
func UpdateFoodRecord(c *gin.Context) {
	recordID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Status:  "error",
			Message: "记录ID无效",
		})
		return
	}

	userID, _ := c.Get("user_id")

	var req FoodRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Status:  "error",
			Message: "请求参数无效: " + err.Error(),
		})
		return
	}

	var foodRecord FoodRecord
	if err := DB.Where("id = ? AND user_id = ?", recordID, userID.(uint)).First(&foodRecord).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{
			Status:  "error",
			Message: "食物记录不存在",
		})
		return
	}

	// 更新记录
	foodRecord.Date = req.Date
	foodRecord.MealType = req.MealType
	foodRecord.FoodItems = req.FoodItems
	foodRecord.Notes = req.Notes

	if err := DB.Save(&foodRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Status:  "error",
			Message: "食物记录更新失败",
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Status:  "success",
		Message: "食物记录更新成功",
		Data:    foodRecord,
	})
}

// DeleteFoodRecord 删除食物记录
func DeleteFoodRecord(c *gin.Context) {
	recordID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Status:  "error",
			Message: "记录ID无效",
		})
		return
	}

	userID, _ := c.Get("user_id")

	var foodRecord FoodRecord
	if err := DB.Where("id = ? AND user_id = ?", recordID, userID.(uint)).First(&foodRecord).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{
			Status:  "error",
			Message: "食物记录不存在",
		})
		return
	}

	if err := DB.Delete(&foodRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Status:  "error",
			Message: "食物记录删除失败",
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Status:  "success",
		Message: "食物记录删除成功",
	})
}

// GetProfile 获取用户信息
func GetProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var user User
	if err := DB.First(&user, userID.(uint)).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{
			Status:  "error",
			Message: "用户不存在",
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Status:  "success",
		Message: "获取用户信息成功",
		Data: gin.H{
			"user_id":  user.ID,
			"username": user.Username,
			"email":    user.Email,
		},
	})
}
