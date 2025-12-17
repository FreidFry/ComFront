import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import type { ThreadsThreeDTOResponce } from '../../types/api';
import { formatDate } from '../../utils/dateFormat';
import './ThreadList.css';

export function ThreadList() {
  const [threads, setThreads] = useState<ThreadsThreeDTOResponce[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async (after?: Date) => {
    try {
      setIsLoading(true);
      const data = await apiService.getThreads(after, 20);
      
      // Проверяем, что data является массивом
      if (!Array.isArray(data)) {
        console.error('API вернул не массив:', data);
        setError('Неверный формат данных от сервера');
        setThreads([]);
        return;
      }
      
      if (after) {
        setThreads((prev) => [...prev, ...data]);
      } else {
        setThreads(data);
      }
      setHasMore(data.length === 20);
    } catch (err: any) {
      console.error('Ошибка загрузки тем:', err);
      setError(err.response?.data?.message || err.message || 'Ошибка загрузки тем');
      // Устанавливаем пустой массив при ошибке, чтобы избежать ошибки map
      if (!after) {
        setThreads([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    if (threads.length > 0 && hasMore) {
      const lastThread = threads[threads.length - 1];
      loadThreads(new Date(lastThread.createdAt));
    }
  };

  if (isLoading && threads.length === 0) {
    return <div className="loading">Загрузка тем...</div>;
  }

  if (error && threads.length === 0) {
    return <div className="error">{error}</div>;
  }

  // Дополнительная проверка перед рендерингом
  if (!Array.isArray(threads)) {
    console.error('threads не является массивом:', threads);
    return <div className="error">Ошибка: неверный формат данных</div>;
  }

  return (
    <div className="thread-list">
      <h1>Темы для обсуждения</h1>
      {threads.length === 0 ? (
        <div className="empty-state">Пока нет тем. Создайте первую!</div>
      ) : (
        <>
          <div className="threads-grid">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                to={`/threads/${thread.id}`}
                className="thread-card"
              >
                <h3>{thread.title}</h3>
                <p className="thread-content" dangerouslySetInnerHTML={{ __html: thread.content }} />
                <div className="thread-meta">
                  <span className="thread-date">{formatDate(thread.createdAt)}</span>
                  <span className="thread-comments">
                    {thread.commentCount} {thread.commentCount === 1 ? 'комментарий' : 'комментариев'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {hasMore && (
            <button onClick={loadMore} className="load-more-button" disabled={isLoading}>
              {isLoading ? 'Загрузка...' : 'Загрузить еще'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

