import { useRef, useState } from 'react';
import { apiService } from '../../services/api';
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Функция для вставки тегов
  const insertTag = (tagName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let replacement = '';
    if (tagName === 'a') {
      const url = prompt('Введите URL:', 'https://');
      if (url === null) return;
      replacement = `<a href="${url}">${selectedText || 'ссылка'}</a>`;
    } else {
      replacement = `<${tagName}>${selectedText}</${tagName}>`;
    }

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    
    // Возвращаем фокус и устанавливаем курсор
    setTimeout(() => {
      textarea.focus();
      const cursorOffset = start + replacement.length;
      textarea.setSelectionRange(cursorOffset, cursorOffset);
    }, 0);
  };

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
      // ... логика обработки ошибок остается прежней ...
      setError(err.response?.data?.message || 'Ошибка создания комментария');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    const MAX_TEXT_FILE_SIZE = 100 * 1024;

    if (selectedFile) {
      const isImage = selectedFile.type.startsWith('image/');
      const isText = selectedFile.type === 'text/plain';

      if (isText && selectedFile.size > MAX_TEXT_FILE_SIZE) {
        setError('Текстовый файл слишком большой. Максимальный размер — 100 КБ');
        resetFileInput();
        return;
      } else if (!isImage && !isText) {
        setError('Можно прикреплять только изображения или текстовые файлы');
        resetFileInput();
        return;
      }
      setError(null);
      setFile(selectedFile);
    }
  };

  const resetFileInput = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      {error && <div className="error-message">{error}</div>}
      
      {/* Панель тегов */}
      <div className="comment-toolbar">
        <button type="button" onClick={() => insertTag('strong')} title="Жирный"><b>B</b></button>
        <button type="button" onClick={() => insertTag('i')} title="Курсив"><i>I</i></button>
        <button type="button" onClick={() => insertTag('a')} title="Ссылка">Link</button>
        <button type="button" onClick={() => insertTag('code')} title="Код">&lt;/&gt;</button>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentCommentId ? 'Напишите ответ...' : 'Напишите комментарий...'}
        rows={4}
        disabled={isLoading}
        className="comment-textarea"
      />

      <div className="comment-form-file">
        <label className="file-label">
          <span>📎 Прикрепить файл</span>
          <input
            type="file"
            accept="image/gif,image/jpeg,image/png,text/plain"
            onChange={handleFileChange}
            disabled={isLoading}
            ref={fileInputRef}
          />
        </label>
        {file && (
          <div className="file-preview">
            <span className="file-name">{file.name}</span>
            <button type="button" onClick={resetFileInput} className="remove-file-button">Удалить</button>
          </div>
        )}
      </div>

      <div className="comment-form-actions">
        <button type="submit" disabled={isLoading || (content.trim() === '' && !file)} className="submit-button">
          {isLoading ? 'Отправка...' : parentCommentId ? 'Ответить' : 'Отправить'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={isLoading} className="cancel-button">Отмена</button>
        )}
      </div>
    </form>
  );
}