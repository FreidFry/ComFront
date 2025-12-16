import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { CommonUserDataDTO } from '../../types/api';
import { formatDate } from '../../utils/dateFormat';
import './Profile.css';

export function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, userId: currentUserId } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CommonUserDataDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Если id не указан в URL, но есть userId из cookies, делаем редирект
    if (!id && currentUserId) {
      navigate(`/profile/${currentUserId}`, { replace: true });
      return;
    }
    
    loadProfile();
  }, [id, currentUserId, navigate]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      // Используем id из URL или из cookies
      const profileId = id || currentUserId || null;
      const data = await apiService.getProfile(profileId);
      setProfile(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки профиля');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Загрузка профиля...</div>;
  }

  if (error || !profile) {
    return <div className="error">{error || 'Профиль не найден'}</div>;
  }

  const isOwnProfile = currentUser && currentUser.userName === profile.userName;

  return (
    <div className="profile">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.avatarTumbnailUrl ? (
            <img src={profile.avatarTumbnailUrl} alt={profile.userName} />
          ) : (
            <div className="avatar-placeholder">{profile.userName[0].toUpperCase()}</div>
          )}
        </div>
        <div className="profile-info">
          <h1>{profile.userName}</h1>
          <div className="profile-meta">
            <span>Зарегистрирован: {formatDate(profile.createdAt)}</span>
            {profile.lastActive && (
              <span>Последняя активность: {formatDate(profile.lastActive)}</span>
            )}
            {profile.homePage && (
              <a href={profile.homePage} target="_blank" rel="noopener noreferrer" className="home-page-link">
                {profile.homePage}
              </a>
            )}
          </div>
        </div>
        {isOwnProfile && (
          <Link to="/profile/edit" className="edit-profile-button">
            Редактировать профиль
          </Link>
        )}
      </div>

      <div className="profile-threads">
        <h2>Темы пользователя ({profile.threads.length})</h2>
        {profile.threads.length === 0 ? (
          <div className="empty-state">У пользователя пока нет тем</div>
        ) : (
          <div className="threads-list">
            {profile.threads.map((thread) => (
              <Link key={thread.id} to={`/threads/${thread.id}`} className="thread-link">
                <div className="thread-item">
                  <h3>{thread.title}</h3>
                  <div className="thread-item-meta">
                    <span>{formatDate(thread.createdAt)}</span>
                    <span>{thread.commentCount} комментариев</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

