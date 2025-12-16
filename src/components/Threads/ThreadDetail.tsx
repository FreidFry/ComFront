import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import type { ThreadWithCommentsDTO } from '../../types/api';
import { formatDate } from '../../utils/dateFormat';
import { CommentTree } from '../Comments/CommentTree';
import { useAuth } from '../../contexts/AuthContext';
import './ThreadDetail.css';

export function ThreadDetail() {
  const { id } = useParams<{ id: string }>();
  const [thread, setThread] = useState<ThreadWithCommentsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (id) {
      loadThread();
    }
  }, [id]);

  const loadThread = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await apiService.getThread(id);
      setThread(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки темы');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentAdded = () => {
    loadThread();
  };

  if (isLoading) {
    return <div className="loading">Загрузка темы...</div>;
  }

  if (error || !thread) {
    return <div className="error">{error || 'Тема не найдена'}</div>;
  }

  const canEdit = isAuthenticated && user && user.userName === thread.ownerUserName;

  return (
    <div className="thread-detail">
      <Link to="/" className="back-link">← Назад к списку тем</Link>
      
      <article className="thread-article">
        <div className="thread-header">
          <h1>{thread.title}</h1>
          {canEdit && (
            <div className="thread-actions">
              <Link to={`/threads/${thread.id}/edit`} className="edit-button">
                Редактировать
              </Link>
            </div>
          )}
        </div>
        
        <div className="thread-meta">
          <span className="thread-author">Автор: {thread.ownerUserName}</span>
          <span className="thread-date">{formatDate(thread.createdAt)}</span>
          {thread.lastUpdatedAt && (
            <span className="thread-updated">
              Обновлено: {formatDate(thread.lastUpdatedAt)}
            </span>
          )}
        </div>

        <div className="thread-content">
          <p>{thread.context}</p>
        </div>

        <div className="thread-stats">
          <span>{thread.commentCount} комментариев</span>
        </div>
      </article>

      <div className="comments-section">
        <h2>Комментарии</h2>
        <CommentTree
          threadId={thread.id}
          comments={thread.comments || []}
          onCommentAdded={handleCommentAdded}
        />
        {!isAuthenticated && (
          <div className="login-prompt">
            <p>⚠️ Войдите, чтобы оставить комментарий</p>
            <Link to="/login" className="login-link">Войти</Link>
          </div>
        )}
      </div>
    </div>
  );
}

