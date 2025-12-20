import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import type { ThreadWithCommentsDTO, PaginatedCommentsDTO } from '../../types/api';
import { formatDate } from '../../utils/dateFormat';
import { CommentTree } from '../Comments/CommentTree';
import { useAuth } from '../../contexts/AuthContext';
import './ThreadDetail.css';

export function ThreadDetail() {
  const { id } = useParams<{ id: string }>();
  const [thread, setThread] = useState<ThreadWithCommentsDTO | null>(null);
  
  // Храним массив комментариев (только items)
  const [comments, setComments] = useState<PaginatedCommentsDTO>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);

      // Запрашиваем данные параллельно для скорости
      // Важно: getThreadComments теперь возвращает массив через apiService (как мы правили ранее)
      const [threadData, commentsArray] = await Promise.all([
        apiService.getThread(id),
        apiService.getThreadComments(id, 'createat', false)
      ]);

      setThread(threadData);
      setComments(commentsArray); 
      
    } catch (err: any) {
      console.error("Ошибка при загрузке данных треда:", err);
      setError('Не удалось загрузить содержимое темы');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="loading-state">Загрузка содержимого...</div>;
  if (error || !thread) return <div className="error-state">{error || 'Тема не найдена'}</div>;

  const canEdit = isAuthenticated && user && user.userName === thread.ownerUserName;

  return (
    <div className="thread-detail-container">
      <nav className="detail-nav">
        <Link to="/" className="back-link">← К списку обсуждений</Link>
      </nav>
      
      <article className="thread-main">
        <header className="thread-header">
          <h1>{thread.title}</h1>
          {canEdit && (
            <Link to={`/threads/${thread.id}/edit`} className="edit-link">
              ✍️ Редактировать
            </Link>
          )}
        </header>
        
        <div className="thread-info">
          <span className="author-tag">Автор: <strong>{thread.ownerUserName}</strong></span>
          <span className="date-tag">{formatDate(thread.createdAt)}</span>
        </div>

        <hr className="divider" />

        <div className="thread-body">
          {/* Используем dangerouslySetInnerHTML только если доверяем источнику (админ-панель/редактор) */}
          <div dangerouslySetInnerHTML={{ __html: thread.context }} />
        </div>
      </article>

      <section className="comments-section">
        <div className="comments-header">
          <h2>Обсуждение</h2>
          <span className="comments-count">Всего загружено: {comments?.items?.length || 0}</span>
        </div>

        {/* Передаем данные в CommentTree. 
          Помните: CommentTree теперь сам умеет делать догрузку через handleLoadMore 
        */}
        {comments && (
  <CommentTree
    threadId={thread.id}
    initialData={comments} 
    onCommentAdded={loadData}
  />
)}
        
        {!isAuthenticated && (
          <div className="auth-reminder">
            <p>Чтобы принять участие в обсуждении, пожалуйста, авторизуйтесь.</p>
            <Link to="/login" className="login-button">Войти в аккаунт</Link>
          </div>
        )}
      </section>
    </div>
  );
}