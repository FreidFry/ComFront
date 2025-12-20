import { useState, useEffect, useMemo } from 'react';
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
  // 1. Основные данные страницы
  const [comments, setComments] = useState<CommentResponseDTO[]>(initialData.items);
  const [nextCursor, setNextCursor] = useState<string | null>(initialData.nextCursor);
  const [hasMore, setHasMore] = useState<boolean>(initialData.hasMore);
  const [isLoading, setIsLoading] = useState(false);

  // 2. История курсоров для кнопки "Назад"
  // null в начале массива означает первую страницу
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Синхронизация при смене темы (сброс к 1-й странице)
  useEffect(() => {
    setComments(initialData.items);
    setNextCursor(initialData.nextCursor);
    setHasMore(initialData.hasMore);
    setCursorHistory([null]);
    setCurrentPageIndex(0);
  }, [initialData]);

  // Универсальная функция загрузки страницы
  const fetchPage = async (cursor: string | null, moveDirection: 'next' | 'prev' | 'refresh') => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response: PaginatedCommentsDTO = await apiService.getThreadComments(threadId, cursor);
      
      // ЗАМЕНЯЕМ элементы (постранично), а не добавляем их
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

      // Плавный скролл к началу обсуждения
      document.querySelector('.comments-section')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error("Ошибка при смене страницы:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (hasMore && nextCursor) fetchPage(nextCursor, 'next');
  };

  const handlePrev = () => {
    if (currentPageIndex > 0) {
      const prevCursor = cursorHistory[currentPageIndex - 1];
      fetchPage(prevCursor, 'prev');
    }
  };

  const refresh = () => fetchPage(null, 'refresh');

  const sortedCommentTree = useMemo(() => {
    const tree = buildCommentTree(comments);
    return [...tree].sort((a, b) => {
      let comp = 0;
      if (sortField === 'createdAt') {
        comp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        comp = (a[sortField] || '').toLowerCase().localeCompare((b[sortField] || '').toLowerCase());
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [comments, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
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
        {sortedCommentTree.length > 0 ? (
          sortedCommentTree.map(comment => (
            <CommentItem
  comment={comment}
  depth={0}
  // Передаем булево значение (сравнение ID)
  isEditing={editingComment === comment.id} 
  
  // Привязываем функции-коллбэки
  onReply={() => setReplyingTo(comment.id)}
  onEdit={() => setEditingComment(comment.id)}
  onCancelEdit={() => setEditingComment(null)}
  
  // Обработчики завершения действий
  onDeleted={refresh}
  onUpdated={() => {
    setEditingComment(null); // закрываем режим редактирования
    refresh();               // обновляем список
  }}
/>
          ))
        ) : (
          <div className="no-comments">На этой странице пусто.</div>
        )}
      </div>

      {/* Панель навигации */}
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