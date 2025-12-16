import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

export function Header() {
  const { user, isAuthenticated, logout, userId } = useAuth();
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

