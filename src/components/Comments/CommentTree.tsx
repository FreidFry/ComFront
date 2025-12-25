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

const SORT_FIELD_KEY = 'comments_sort_field';
const SORT_ORDER_KEY = 'comments_sort_order';

export function CommentTree({ threadId, initialData, onCommentAdded }: CommentTreeProps) {
  // 1. Стейт сортировки
  const [sortField, setSortField] = useState<SortField>(() => 
    (localStorage.getItem(SORT_FIELD_KEY) as SortField) || 'createdAt'
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => 
    (localStorage.getItem(SORT_ORDER_KEY) as SortOrder) || 'desc'
  );

  // 2. Стейт данных
  const [comments, setComments] = useState<CommentResponseDTO[]>(initialData.items);
  const [nextCursor, setNextCursor] = useState<string | null>(initialData.nextCursor);
  const [hasMore, setHasMore] = useState<boolean>(initialData.hasMore);
  const [isLoading, setIsLoading] = useState(false);

  // 3. Стейт пагинации
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // 4. Стейт UI (редактирование и ответы)
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);

  // Сохраняем настройки при изменении
  useEffect(() => {
    localStorage.setItem(SORT_FIELD_KEY, sortField);
    localStorage.setItem(SORT_ORDER_KEY, sortOrder);
  }, [sortField, sortOrder]);

  // Функция загрузки страниц/сортировок
  const fetchPage = useCallback(async (field: SortField, order: SortOrder, cursor: string | null, direction: 'next' | 'prev' | 'refresh') => {
    setIsLoading(true);
    try {
      const response = await apiService.getThreadComments(threadId, field, order === 'asc', cursor);
      setComments([...response.items]);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);

      if (direction === 'next') {
        setCursorHistory(prev => [...prev, cursor]);
        setCurrentPageIndex(prev => prev + 1);
      } else if (direction === 'prev') {
        setCurrentPageIndex(prev => prev - 1);
      } else {
        setCursorHistory([null]);
        setCurrentPageIndex(0);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Ошибка загрузки данных:", err);
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  // Обработка смены сортировки
  const handleSortChange = (field: SortField) => {
    const newOrder = sortField === field && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortOrder(newOrder);
    fetchPage(field, newOrder, null, 'refresh');
  };

  // Метод для полного обновления через родителя (смена key)
  const triggerGlobalUpdate = () => {
    onCommentAdded?.(); 
  };

  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  return (
    <div className={`comment-system ${isLoading ? 'is-loading' : ''}`}>
      <div className="comment-system-header">
        <h3>Обсуждение (Страница {currentPageIndex + 1})</h3>
        <CommentForm threadId={threadId} onCommentAdded={triggerGlobalUpdate} />
      </div>

      <div className="sort-panel">
        {(['userName', 'email', 'createdAt'] as SortField[]).map(field => (
          <button 
            key={field} 
            onClick={() => handleSortChange(field)}
            className={`sort-btn ${sortField === field ? 'active' : ''}`}
            disabled={isLoading}
          >
            {field === 'userName' ? 'Имя' : field === 'email' ? 'E-mail' : 'Дата'}
            {sortField === field && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
          </button>
        ))}
      </div>

      <div className="comments-list-wrapper" style={{ opacity: isLoading ? 0.7 : 1 }}>
        {commentTree.map(comment => (
          <div key={comment.id} className="comment-thread-group">
            {editingComment === comment.id ? (
              <div className="edit-form-wrapper" style={{ marginLeft: '0px' }}>
                <CommentForm 
                  threadId={threadId}
                  initialContent={comment.content} // Передаем старый текст
                  onCommentAdded={() => {
                    setEditingComment(null);
                    triggerGlobalUpdate();
                  }}
                  onCancel={() => setEditingComment(null)}
                  // Здесь на бэкенде должен быть метод PUT /api/comments/{id}
                  // или специальный флаг editId в CommentForm
                />
              </div>
            ) : (
              <CommentItem 
                comment={comment}
                depth={0}
                isEditing={editingComment === comment.id || replyingTo === comment.id}
                activeReplyId={replyingTo}
                onEdit={(id) => setEditingComment(id)} // Передаем ID вверх
                onCancelEdit={() => setEditingComment(null)}
                onDeleted={triggerGlobalUpdate}
                onUpdated={() => {
                   setEditingComment(null);
                   triggerGlobalUpdate();
                }}
                onReply={(id) => setReplyingTo(id)} // Передаем ID вверх
              />
            )}
          </div>
        ))}
      </div>

      <div className="pagination-nav-container">
        <button 
          className="pag-nav-btn"
          disabled={currentPageIndex === 0 || isLoading} 
          onClick={() => fetchPage(sortField, sortOrder, cursorHistory[currentPageIndex - 1], 'prev')}
        >
          ← Назад
        </button>
        <span className="page-info">Стр. {currentPageIndex + 1}</span>
        <button 
          className="pag-nav-btn"
          disabled={!hasMore || isLoading} 
          onClick={() => fetchPage(sortField, sortOrder, nextCursor, 'next')}
        >
          Вперед →
        </button>
      </div>
    </div>
  );
}