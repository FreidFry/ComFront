import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext'; // Импортируем хук
import './Header.css';

export function Header() {
  const { user, isAuthenticated, logout, userId } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(); // Получаем данные об уведомлениях
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          <h1>Комментарии</h1>
        </Link>
        <nav className="header-nav">
          {isAuthenticated ? (
            <>
              <Link to="/threads/new" className="header-link">
                Создать тему
              </Link>
              <div className="notification-wrapper" style={{ position: 'relative' }}>
                {/* САМА КНОПКА КОЛОКОЛЬЧИКА */}
                <button 
                  className={`notification-trigger ${unreadCount > 0 ? 'has-unread' : ''}`}
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{ position: 'relative', cursor: 'pointer', fontSize: '20px', background: 'none', border: 'none' }}
                >
                  🔔 
                  {unreadCount > 0 && (
                    <span className="notification-badge" style={{
                      position: 'absolute', top: '-5px', right: '-5px',
                      background: 'red', color: 'white', borderRadius: '50%',
                      padding: '2px 6px', fontSize: '10px'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* ВЫПАДАЮЩЕЕ ОКНО */}
                {showNotifications && (
                  <div className="notification-dropdown" style={{
                    position: 'absolute', right: 0, top: '40px', width: '300px',
                    backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, color: '#333'
                  }}>
                    
                    {/* ШАПКА С КНОПКОЙ ОТМЕТИТЬ ВСЕ */}
                    <div className="dropdown-header" style={{
                      display: 'flex', justifyContent: 'space-between', padding: '10px',
                      borderBottom: '1px solid #eee', alignItems: 'center'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>Уведомления</span>
                      {notifications.length > 0 && (
                        <button 
                          onClick={markAllAsRead} 
                          style={{ color: '#007bff', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Прочитать всё
                        </button>
                      )}
                    </div>

                    {/* СПИСОК УВЕДОМЛЕНИЙ */}
                    <div className="dropdown-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div key={n.id} className="notification-item" style={{
                            padding: '10px', borderBottom: '1px solid #f9f9f9', display: 'flex', flexDirection: 'column'
                          }}>
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>{n.title}</div>
                            <div style={{ fontSize: '13px', color: '#666' }}>{n.message}</div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                              {/* ССЫЛКА НА ПОСТ */}
                              {n.threadId && (
                                <a href={`/threads/${n.threadId}/Comments/?focuscommentid=${n.commentId}`} style={{ color: '#28a745', fontSize: '12px', textDecoration: 'none' }}>
                                  Перейти к посту →
                                </a>
                              )}
                              {/* КНОПКА УДАЛИТЬ ОДНО */}
                              <button 
                                onClick={() => markAsRead(n.id)}
                                style={{ fontSize: '11px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '3px' }}
                              >
                                Ок
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                          Нет новых уведомлений
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Link 
                to={userId ? `/profile/${userId}` : '/profile'} 
                className="header-link"
              >
                Профиль
              </Link>
              <div className="header-user">
                <span>{user?.userName}</span>
                <button onClick={handleLogout} className="header-logout">
                  Выйти
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="header-link">
                Войти
              </Link>
              <Link to="/register" className="header-link">
                Регистрация
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}