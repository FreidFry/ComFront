import { useRef, useState } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './CommentForm.css';

interface CommentFormProps {
  threadId: string;
  parentCommentId?: string | null;
  onCommentAdded: () => void;
  onCancel?: () => void;
  initialContent?: string;
}

export function CommentForm({
  threadId,
  parentCommentId = null,
  onCommentAdded,
  onCancel,
  initialContent = '',
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (content.trim() === '' && !file) {
      setError('Введите текст или прикрепите файл');
      return;
    }

    setIsLoading(true);

    try {
      await apiService.createComment({
        content: content.trim(),
        threadId,
        parentCommentId,
        formFile: file ?? undefined,
      });
      setContent('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onCommentAdded();
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorString = typeof errorData === 'string' ? errorData : JSON.stringify(errorData || err.message || '');
      
      // Если ошибка 500 из-за проблемы с CreatedAtAction на бэкенде,
      // комментарий все равно может быть создан, поэтому обновляем список
      if (err.response?.status === 500 && 
          (errorString.includes('No route matches the supplied values') || 
           errorString.includes('CreatedAtActionResult') ||
           (err as any).isBackendRouteError)) {
        console.warn('Backend returned 500 due to route issue, but comment may have been created. Refreshing comments...');
        setContent('');
        onCommentAdded(); // Обновляем список комментариев, так как комментарий мог быть создан
        return; // Не показываем ошибку пользователю
      }
      
      // Если ошибка 401, обновляем состояние аутентификации
      if (err.response?.status === 401) {
        await refreshUser();
        setError('Требуется авторизация. Пожалуйста, войдите в систему.');
      } else if (errorData?.errors) {
        const errorMessages = errorData.errors.map((e: any) => e.errorMessage).join(', ');
        setError(errorMessages);
      } else {
        setError(errorData?.message || 'Ошибка создания комментария');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setFile(selectedFile ?? null);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      {error && <div className="error-message">{error}</div>}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentCommentId ? 'Напишите ответ...' : 'Напишите комментарий...'}
        rows={4}
        disabled={isLoading}
        className="comment-textarea"
      />
      <div className="comment-form-file">
        <label className="file-label">
          <span>Прикрепить файл (изображение или текст)</span>
          <input
            type="file"
            accept="image/*,text/plain"
            onChange={handleFileChange}
            disabled={isLoading}
            ref={fileInputRef}
          />
        </label>
        {file && (
          <div className="file-preview">
            <span className="file-name">{file.name}</span>
            <button type="button" onClick={handleRemoveFile} disabled={isLoading} className="remove-file-button">
              Удалить
            </button>
          </div>
        )}
      </div>
      <div className="comment-form-actions">
        <button type="submit" disabled={isLoading || (content.trim() === '' && !file)} className="submit-button">
          {isLoading ? 'Отправка...' : parentCommentId ? 'Ответить' : 'Отправить'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={isLoading} className="cancel-button">
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}

