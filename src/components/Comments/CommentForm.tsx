import { useRef, useState } from 'react';
import { apiService } from '../../services/api';
import './CommentForm.css';

interface CommentFormProps {
  threadId: string;
  parentCommentId?: string | null;
  onCommentAdded: (content?: string) => void;
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
  
  // Состояния для капчи
  const [captchaId, setCaptchaId] = useState<string>('');
  const [captchaImage, setCaptchaImage] = useState<string>('');
  const [captchaInput, setCaptchaInput] = useState<string>('');
  
  // Флаг отображения капчи
  const [showCaptcha, setShowCaptcha] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Функция запроса капчи
  const fetchNewCaptcha = async () => {
    try {
      const data = await apiService.getCaptcha(); 
      setCaptchaId(data.id);
      setCaptchaImage(data.imageBase64);
      setCaptchaInput('');
      setShowCaptcha(true);
    } catch (err) {
      setError('Не удалось загрузить защитный код. Попробуйте снова.');
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.preventDefault();
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Сбрасываем значение input
    }
  };

  const insertTag = (tagName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let replacement = (tagName === 'a') 
        ? `<a href="">${selectedText}</a>` 
        : `<${tagName}>${selectedText}</${tagName}>`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      const cursorOffset = start + replacement.length;
      textarea.setSelectionRange(cursorOffset, cursorOffset);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isEditMode = initialContent !== '';

    // ШАГ 1: Если капча еще не показана — запрашиваем её
    if (!isEditMode && !showCaptcha) {
      setIsLoading(true);
      await fetchNewCaptcha();
      setIsLoading(false);
      return;
    }

    // ШАГ 2: Валидация ввода капчи
    if (showCaptcha && !captchaInput.trim()) {
      setError('Введите код с картинки');
      return;
    }

    // ШАГ 3: Финальная отправка
    setIsLoading(true);
    try {
      if (isEditMode) {
        await apiService.updateComment(parentCommentId!, {
          commentId: parentCommentId!,
          content: content.trim(),
        });
      } else {
        await apiService.createComment({
          content: content.trim(),
          threadId,
          parentCommentId,
          formFile: file ?? undefined,
          captchaId,
          captchaValue: captchaInput.trim()
        });
      }

      if (!isEditMode) {
        setContent('');
        setFile(null);
        setCaptchaInput('');
        setShowCaptcha(false);
      }
      
      onCommentAdded();
    } catch (err: any) {
      let msg = 'Ошибка отправки.';

  if (err.response) {
    // Сервер ответил с кодом ошибки (4xx, 5xx)
    const status = err.response.status;

    if (status === 404) {
      msg = 'Ресурс не найден (404). Проверьте правильность адреса.';
    } else if (status === 401) {
      msg = 'Пожалуйста войдите в аккаунт.';
    } else {
      msg = err.response.data?.message || msg;
    }
  } else if (err.request) {
    msg = 'Сервер не отвечает. Проверьте интернет-соединение.';
  }

  setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="comment-toolbar">
        <button type="button" onClick={() => insertTag('strong')}><b>B</b></button>
        <button type="button" onClick={() => insertTag('i')}><i>I</i></button>
        <button type="button" onClick={() => insertTag('a')}>Link</button>
        <button type="button" onClick={() => insertTag('code')}>Code</button>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="comment-textarea"
        placeholder={parentCommentId ? "Ваш ответ..." : "Ваш комментарий..."}
        rows={4}
        disabled={isLoading}
      />

      <div className="comment-form-footer">
        <div className="file-upload-zone">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => setFile(e.target.files?.[0] || null)} 
            style={{display: 'none'}} 
            id={`file-${parentCommentId || 'main'}`} 
          />
          <div className="file-controls">
            <label htmlFor={`file-${parentCommentId || 'main'}`} className="file-label">
              {file ? `📎 ${file.name.substring(0, 15)}...` : '📎 Прикрепить файл'}
            </label>
            
            {file && (
              <button 
                type="button" 
                className="remove-file-button" 
                onClick={handleRemoveFile}
                title="Удалить файл"
              >
                ✕
              </button>
            )}
          </div>
          
        </div>

        {/* Блок капчи, появляющийся только после нажатия "Отправить" */}
        {showCaptcha && (
          <div className="captcha-container">
            <div className="captcha-img" onClick={fetchNewCaptcha} title="Обновить">
              {captchaImage ? (
                <img src={`data:image/png;base64,${captchaImage}`} alt="captcha" />
              ) : (
                <span>...</span>
              )}
            </div>
            <input
              type="text"
              className="captcha-input"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              placeholder="Код"
              maxLength={6}
              autoFocus
              disabled={isLoading}
            />
          </div>
        )}
      </div>

      <div className="comment-form-actions">
        <button 
          type="submit" 
          disabled={isLoading || (!content.trim() && !file)} 
          className={`submit-button ${showCaptcha ? 'confirm' : ''}`}
        >
          {isLoading ? 'Секунду...' : showCaptcha ? 'Подтвердить' : 'Отправить'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="cancel-button">
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}