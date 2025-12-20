import { useState, useEffect, useMemo, useCallback } from 'react';
import { apiService } from '../../services/api';
import type { CommentResponseDTO, PaginatedCommentsDTO } from '../../types/api';
import { buildCommentTree } from '../../utils/commentTree';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import './CommentTree.css';

type SortField = 'userName' | 'email' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface CommentTreeProps {
  threadId: string;
  initialData: PaginatedCommentsDTO;
  onCommentAdded?: () => void;
}

export function CommentTree({ threadId, initialData, onCommentAdded }: CommentTreeProps) {
  // 1. Состояние данных
  const [comments, setComments] = useState<CommentResponseDTO[]>(initialData.items);
  const [nextCursor, setNextCursor] = useState<string | null>(initialData.nextCursor);
  const [hasMore, setHasMore] = useState<boolean>(initialData.hasMore);
  const [isLoading, setIsLoading] = useState(false);

  // 2. Навигация и Сортировка
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 3. UI состояния (редактирование и ответ)
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);

  // Синхронизация при смене темы
  useEffect(() => {
    setComments(initialData.items);
    setNextCursor(initialData.nextCursor);
    setHasMore(initialData.hasMore);
    setCursorHistory([null]);
    setCurrentPageIndex(0);
  }, [initialData]);

  // Универсальная функция загрузки (теперь учитывает сортировку)
  const fetchPage = useCallback(async (cursor: string | null, moveDirection: 'next' | 'prev' | 'refresh') => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      // Отправляем параметры на бэкенд
      const response = await apiService.getThreadComments(
        threadId, 
        sortField,
        sortOrder === 'asc',
        cursor
      );
      
      setComments(response.items);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);

      if (moveDirection === 'next') {
        setCursorHistory(prev => [...prev, cursor]);
        setCurrentPageIndex(prev => prev + 1);
      } else if (moveDirection === 'prev') {
        setCurrentPageIndex(prev => prev - 1);
      } else if (moveDirection === 'refresh') {
        setCursorHistory([null]);
        setCurrentPageIndex(0);
        onCommentAdded?.();
      }

      // Скролл вверх при смене страницы
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Ошибка загрузки:", err);
    } finally {
      setIsLoading(false);
    }
  }, [threadId, sortField, sortOrder, isLoading, onCommentAdded]);

  // Срабатывает при смене сортировки пользователем
  useEffect(() => {
    // Не запускаем при первом рендере, так как есть initialData
    if (currentPageIndex !== 0 || sortField !== 'createdAt' || sortOrder !== 'desc') {
        fetchPage(null, 'refresh');
    }
  }, [sortField, sortOrder]);

  const handleNext = () => (hasMore && nextCursor) && fetchPage(nextCursor, 'next');
  const handlePrev = () => (currentPageIndex > 0) && fetchPage(cursorHistory[currentPageIndex - 1], 'prev');
  const refresh = () => fetchPage(null, 'refresh');

  // Строим дерево из плоского списка (сортировка уже сделана на сервере)
  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className={`comment-system ${isLoading ? 'is-loading-content' : ''}`}>
      <div className="comment-system-header">
        <h3>Обсуждение (Страница {currentPageIndex + 1})</h3>
        <CommentForm threadId={threadId} onCommentAdded={refresh} />
      </div>

      <div className="sort-panel">
        <span className="sort-label">Сортировать по:</span>
        {(['userName', 'email', 'createdAt'] as SortField[]).map(field => (
          <button 
            key={field}
            onClick={() => toggleSort(field)} 
            className={`sort-btn ${sortField === field ? 'active' : ''}`}
          >
            {field === 'userName' ? 'Имени' : field === 'email' ? 'E-mail' : 'Дате'}
            {sortField === field && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
          </button>
        ))}
      </div>

      <div className="comments-list-wrapper">
        {commentTree.length > 0 ? (
          commentTree.map(comment => (
            <div key={comment.id} className="comment-thread-group">
              <CommentItem
                comment={comment}
                depth={0}
                isEditing={editingComment === comment.id} 
                onReply={() => setReplyingTo(comment.id)}
                onEdit={() => setEditingComment(comment.id)}
                onCancelEdit={() => setEditingComment(null)}
                onDeleted={refresh}
                onUpdated={() => {
                  setEditingComment(null);
                  refresh();
                }}
              />
              
              {/* Рендерим форму ответа прямо под родительским комментарием */}
              {replyingTo === comment.id && (
                <div className="reply-form-container">
                  <CommentForm 
                    threadId={threadId} 
                    parentCommentId={comment.id}
                    onCommentAdded={() => {
                        setReplyingTo(null);
                        refresh();
                    }}
                    onCancel={() => setReplyingTo(null)}
                  />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="no-comments">На этой странице пусто.</div>
        )}
      </div>

      <div className="pagination-nav-container">
        <button 
          className="pag-nav-btn" 
          onClick={handlePrev} 
          disabled={currentPageIndex === 0 || isLoading}
        >
          ← Назад
        </button>

        <span className="page-info">
          Страница <strong>{currentPageIndex + 1}</strong>
        </span>

        <button 
          className="pag-nav-btn" 
          onClick={handleNext} 
          disabled={!hasMore || isLoading}
        >
          Вперед →
        </button>
      </div>
    </div>
  );
}