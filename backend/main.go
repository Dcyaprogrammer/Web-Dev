package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化数据库
	InitDatabase()

	// 创建Gin路由器
	r := gin.Default()

	// 配置CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"} // React应用的地址
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	config.AllowCredentials = true
	r.Use(cors.New(config))

	// 公开路由 (不需要认证)
	public := r.Group("/api")
	{
		public.POST("/register", Register)
		public.POST("/login", Login)
	}

	// 需要认证的路由
	protected := r.Group("/api")
	protected.Use(AuthMiddleware())
	{
		// 用户相关
		protected.GET("/profile", GetProfile)

		// 食物记录相关
		protected.POST("/food-records", CreateFoodRecord)
		protected.GET("/food-records", GetFoodRecords)
		protected.PUT("/food-records/:id", UpdateFoodRecord)
		protected.DELETE("/food-records/:id", DeleteFoodRecord)
	}

	// 健康检查端点
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "食物日记服务运行正常",
		})
	})

	log.Println("服务器启动在 :8080 端口")
	log.Fatal(r.Run(":8080"))
}
