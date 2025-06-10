import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { foodAPI } from '../services/api';
import { 
  Calendar, 
  Plus, 
  LogOut, 
  User, 
  ChevronLeft, 
  ChevronRight,
  Edit,
  Trash2,
  Coffee,
  Sun,
  Moon,
  Cookie
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [foodRecords, setFoodRecords] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 获取当前月份的食物记录
  useEffect(() => {
    fetchFoodRecords();
  }, [currentDate]);

  const fetchFoodRecords = async () => {
    setIsLoading(true);
    try {
      const month = currentDate.toISOString().slice(0, 7); // YYYY-MM格式
      const response = await foodAPI.getRecords({ month });
      setFoodRecords(response.data.data || []);
    } catch (error) {
      console.error('获取食物记录失败:', error);
      setError('获取食物记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取指定日期的记录
  const getRecordsForDate = (date) => {
    const dateStr = date.toISOString().slice(0, 10);
    return foodRecords.filter(record => record.date === dateStr);
  };

  // 生成日历
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const calendar = [];
    const current = new Date(startDate);

    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(current);
        const records = getRecordsForDate(date);
        const isCurrentMonth = date.getMonth() === month;
        const isToday = date.toDateString() === new Date().toDateString();
        const isSelected = date.toDateString() === selectedDate.toDateString();

        weekDays.push({
          date,
          records,
          isCurrentMonth,
          isToday,
          isSelected,
        });
        current.setDate(current.getDate() + 1);
      }
      calendar.push(weekDays);
    }

    return calendar;
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowAddForm(false);
    setEditingRecord(null);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getMealIcon = (mealType) => {
    switch (mealType) {
      case '早餐': return <Sun size={16} />;
      case '午餐': return <Coffee size={16} />;
      case '晚餐': return <Moon size={16} />;
      case '零食': return <Cookie size={16} />;
      default: return <Coffee size={16} />;
    }
  };

  const getMealColor = (mealType) => {
    switch (mealType) {
      case '早餐': return '#ff9500';
      case '午餐': return '#007aff';
      case '晚餐': return '#5856d6';
      case '零食': return '#ff3b30';
      default: return '#007aff';
    }
  };

  const handleDeleteRecord = async (recordId) => {
    try {
      await foodAPI.deleteRecord(recordId);
      fetchFoodRecords();
    } catch (error) {
      console.error('删除记录失败:', error);
      setError('删除记录失败');
    }
  };

  const handleLogout = () => {
    logout();
  };

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="dashboard">
      {/* 头部导航 */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <Calendar size={24} />
            <span>食物日记</span>
          </div>
        </div>
        <div className="header-right">
          <div className="user-info">
            <User size={18} />
            <span>{user?.username}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            <span>退出</span>
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* 日历区域 */}
        <div className="calendar-section">
          <div className="calendar-header">
            <button onClick={handlePrevMonth} className="nav-btn">
              <ChevronLeft size={20} />
            </button>
            <h2>{currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}</h2>
            <button onClick={handleNextMonth} className="nav-btn">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="calendar">
            <div className="calendar-weekdays">
              {weekDays.map(day => (
                <div key={day} className="weekday">{day}</div>
              ))}
            </div>
            
            <div className="calendar-days">
              {generateCalendar().map((week, weekIndex) => (
                <div key={weekIndex} className="calendar-week">
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`calendar-day ${
                        !day.isCurrentMonth ? 'other-month' : ''
                      } ${day.isToday ? 'today' : ''} ${
                        day.isSelected ? 'selected' : ''
                      }`}
                      onClick={() => handleDateClick(day.date)}
                    >
                      <span className="day-number">{day.date.getDate()}</span>
                      {day.records.length > 0 && (
                        <div className="day-indicators">
                          {day.records.slice(0, 3).map((record, index) => (
                            <div
                              key={index}
                              className="meal-indicator"
                              style={{ backgroundColor: getMealColor(record.meal_type) }}
                              title={`${record.meal_type}: ${record.food_items}`}
                            />
                          ))}
                          {day.records.length > 3 && (
                            <div className="more-indicator">+{day.records.length - 3}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 详情区域 */}
        <div className="details-section">
          <div className="details-header">
            <h3>{selectedDate.toLocaleDateString('zh-CN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</h3>
            <button 
              onClick={() => setShowAddForm(true)} 
              className="add-btn"
            >
              <Plus size={18} />
              <span>添加记录</span>
            </button>
          </div>

          <div className="records-list">
            {getRecordsForDate(selectedDate).length === 0 ? (
              <div className="empty-state">
                <Calendar size={48} />
                <p>这一天还没有食物记录</p>
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="add-first-btn"
                >
                  添加第一条记录
                </button>
              </div>
            ) : (
              getRecordsForDate(selectedDate).map(record => (
                <div key={record.id} className="record-item">
                  <div className="record-header">
                    <div className="meal-info">
                      <div 
                        className="meal-icon"
                        style={{ color: getMealColor(record.meal_type) }}
                      >
                        {getMealIcon(record.meal_type)}
                      </div>
                      <span className="meal-type">{record.meal_type}</span>
                    </div>
                    <div className="record-actions">
                      <button 
                        onClick={() => setEditingRecord(record)}
                        className="action-btn edit-btn"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm('确定要删除这条记录吗？')) {
                            handleDeleteRecord(record.id);
                          }
                        }}
                        className="action-btn delete-btn"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="record-content">
                    <p className="food-items">{record.food_items}</p>
                    {record.notes && (
                      <p className="notes">{record.notes}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 添加/编辑表单模态框 */}
      {(showAddForm || editingRecord) && (
        <FoodRecordModal
          record={editingRecord}
          selectedDate={selectedDate}
          onClose={() => {
            setShowAddForm(false);
            setEditingRecord(null);
          }}
          onSave={fetchFoodRecords}
        />
      )}

      {error && (
        <div className="error-toast">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
    </div>
  );
};

// 食物记录表单模态框组件
const FoodRecordModal = ({ record, selectedDate, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    date: selectedDate.toISOString().slice(0, 10),
    meal_type: '早餐',
    food_items: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (record) {
      setFormData({
        date: record.date,
        meal_type: record.meal_type,
        food_items: record.food_items,
        notes: record.notes || '',
      });
    }
  }, [record]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (record) {
        await foodAPI.updateRecord(record.id, formData);
      } else {
        await foodAPI.createRecord(formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('保存记录失败:', error);
      setError(error.response?.data?.message || '保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('确定要删除这条记录吗？')) {
      return;
    }

    try {
      await foodAPI.deleteRecord(recordId);
      onSave();
    } catch (error) {
      console.error('删除记录失败:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{record ? '编辑食物记录' : '添加食物记录'}</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <form onSubmit={handleSubmit} className="record-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>日期</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>餐次</label>
            <select
              value={formData.meal_type}
              onChange={(e) => setFormData({...formData, meal_type: e.target.value})}
              required
              disabled={isLoading}
            >
              <option value="早餐">早餐</option>
              <option value="午餐">午餐</option>
              <option value="晚餐">晚餐</option>
              <option value="零食">零食</option>
            </select>
          </div>

          <div className="form-group">
            <label>食物内容</label>
            <textarea
              value={formData.food_items}
              onChange={(e) => setFormData({...formData, food_items: e.target.value})}
              placeholder="请描述你吃了什么..."
              rows={4}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>备注（可选）</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="添加一些备注..."
              rows={2}
              disabled={isLoading}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={isLoading}>
              取消
            </button>
            <button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Dashboard; 