import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import type { ThreadUpdateDTO } from '../../types/api';
import './EditThread.css';

export function EditThread() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadThread();
  }, [id]);

  const loadThread = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getThread(id!);
      setTitle(data.title);
      setContext(data.context);
    } catch (err) {
      setError('Не удалось загрузить данные темы');
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для вставки HTML тегов (как в CommentForm)
  const insertTag = (tagName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = context.substring(start, end);
    
    let replacement = (tagName === 'a') 
        ? `<a href="">${selectedText}</a>` 
        : `<${tagName}>${selectedText}</${tagName}>`;

    const newContext = context.substring(0, start) + replacement + context.substring(end);
    setContext(newContext);
    
    setTimeout(() => {
      textarea.focus();
      const cursorOffset = start + replacement.length;
      textarea.setSelectionRange(cursorOffset, cursorOffset);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !title.trim() || !context.trim()) return;

    try {
      setIsSaving(true);
      const updateData: ThreadUpdateDTO = {
        title: title.trim(),
        context: context.trim()
      };

      await apiService.updateThread(id, updateData);
      navigate(`/threads/${id}`); 
    } catch (err) {
      setError('Ошибка при сохранении изменений');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="loading-state">Загрузка данных...</div>;

  return (
    <div className="edit-thread-container">
      <nav className="edit-nav">
        <Link to={`/threads/${id}`} className="back-link">← Вернуться к теме</Link>
      </nav>

      <div className="edit-card">
        <h1>Редактирование обсуждения</h1>
        
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="edit-thread-form">
          <div className="form-group">
            <label>Заголовок</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isSaving}
            />
          </div>

          <div className="form-group">
            <label>Текст сообщения</label>
            <div className="comment-toolbar">
              <button type="button" onClick={() => insertTag('strong')}><b>B</b></button>
              <button type="button" onClick={() => insertTag('i')}><i>I</i></button>
              <button type="button" onClick={() => insertTag('a')}>Link</button>
              <button type="button" onClick={() => insertTag('code')}>Code</button>
            </div>
            <textarea
              ref={textareaRef}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={15}
              required
              disabled={isSaving}
            />
          </div>

          <div className="edit-actions">
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="btn-cancel"
              disabled={isSaving}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              className="btn-save" 
              disabled={isSaving || !title.trim() || !context.trim()}
            >
              {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}