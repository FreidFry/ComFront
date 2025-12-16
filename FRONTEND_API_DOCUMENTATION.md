# Документация API для фронтенда

## Содержание

1. [Введение](#введение)
2. [Настройка и конфигурация](#настройка-и-конфигурация)
3. [Аутентификация](#аутентификация)
4. [API Endpoints](#api-endpoints)
5. [Структуры данных](#структуры-данных)
6. [Примеры использования](#примеры-использования)
7. [Обработка ошибок](#обработка-ошибок)

---

## Введение

Данная документация описывает REST API для системы комментариев. API предоставляет функциональность для работы с пользователями, темами (threads) и комментариями.

### Основные возможности

- Регистрация и аутентификация пользователей
- Создание и управление темами (threads)
- Создание и управление комментариями с поддержкой древовидной структуры
- Управление профилем пользователя
- Пагинация для списков тем и комментариев

---

## Настройка и конфигурация

### Базовый URL

**Development:**
- HTTPS: `https://localhost:7042`
- HTTP: `http://localhost:5140`

**Production:**
- URL будет указан при развертывании

### CORS

API настроен для работы с фронтендом на следующих адресах:
- `https://localhost:24815`
- `http://localhost:24815`

**Важно:** При запросах необходимо использовать `credentials: 'include'` для отправки cookies.

### Формат URL

API использует следующие правила для URL:
- Все URL в **lowercase** (нижний регистр)
- Все URL заканчиваются **trailing slash** (`/`)
- Query параметры также в lowercase

**Примеры:**
- ✅ `https://localhost:7042/api/auth/login/`
- ✅ `https://localhost:7042/threads/?after=2024-01-01T00:00:00Z&limit=20`
- ❌ `https://localhost:7042/api/auth/Login` (неправильно - заглавная буква)
- ❌ `https://localhost:7042/threads` (неправильно - нет trailing slash)

### Заголовки запросов

Все запросы должны содержать:
```http
Content-Type: application/json
```

Для аутентифицированных запросов JWT токен автоматически отправляется через cookie `jwt`.

---

## Аутентификация

API использует JWT (JSON Web Token) аутентификацию через HTTP-only cookies. Токен автоматически отправляется с каждым запросом после успешного входа.

### Регистрация пользователя

**Endpoint:** `POST /api/auth/register/`

**Требует аутентификации:** Нет

**Request Body:**
```json
{
  "userName": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string",
  "homePage": "string | null"
}
```

**Поля:**
- `userName` (обязательно) - имя пользователя
- `email` (обязательно) - email адрес
- `password` (обязательно) - пароль
- `confirmPassword` (обязательно) - подтверждение пароля
- `homePage` (опционально) - домашняя страница пользователя

**Response:**
- `200 OK` - пользователь успешно зарегистрирован
- `400 Bad Request` - ошибки валидации

**Пример запроса:**
```javascript
const response = await fetch('https://localhost:7042/api/auth/register/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    userName: 'JohnDoe',
    email: 'john@example.com',
    password: 'SecurePassword123',
    confirmPassword: 'SecurePassword123',
    homePage: 'https://johndoe.com'
  })
});
```

### Вход в систему

**Endpoint:** `POST /api/auth/login/`

**Требует аутентификации:** Нет

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
- `200 OK` - успешный вход, JWT токен установлен в cookie
- `401 Unauthorized` - неверный пароль
- `404 Not Found` - пользователь не найден

**Пример запроса:**
```javascript
const response = await fetch('https://localhost:7042/api/auth/login/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePassword123'
  })
});

if (response.ok) {
  const data = await response.json();
  console.log(data.message); // "Login successful"
  // JWT токен автоматически сохранен в cookie
}
```

### Выход из системы

**Endpoint:** `POST /api/auth/logout/`

**Требует аутентификации:** Да

**Response:**
- `200 OK` - успешный выход

**Пример запроса:**
```javascript
const response = await fetch('https://localhost:7042/api/auth/logout/', {
  method: 'POST',
  credentials: 'include'
});

if (response.ok) {
  const data = await response.json();
  console.log(data.message); // "Logout successful"
  // JWT cookie удалена
}
```

### Работа с JWT токенами

JWT токен автоматически сохраняется в HTTP-only cookie с именем `jwt` после успешного входа. Токен автоматически отправляется с каждым последующим запросом благодаря настройке `credentials: 'include'`.

**Важно:**
- Cookie имеет флаги: `HttpOnly`, `Secure`, `SameSite=None`
- Токен содержит информацию о пользователе (ID и роли)
- Токен имеет срок действия (настраивается на сервере)

---

## API Endpoints

### Теми (Threads)

#### Получить список тем

**Endpoint:** `GET /threads/`

**Требует аутентификации:** Нет

**Query Parameters:**
- `after` (опционально) - DateTime в формате ISO 8601. Получить темы, созданные после указанной даты
- `limit` (опционально, по умолчанию 20) - максимальное количество тем для возврата

**Response:**
- `200 OK` - массив объектов `ThreadsThreeDTOResponce`

**Пример запроса:**
```javascript
// Получить первые 20 тем
const response = await fetch('https://localhost:7042/threads/?limit=20', {
  credentials: 'include'
});

// Получить темы после определенной даты
const afterDate = new Date('2024-01-01T00:00:00Z').toISOString();
const response = await fetch(`https://localhost:7042/threads/?after=${afterDate}&limit=10`, {
  credentials: 'include'
});
```

#### Получить тему по ID

**Endpoint:** `GET /threads/{id}/`

**Требует аутентификации:** Нет

**Path Parameters:**
- `id` - GUID темы

**Response:**
- `200 OK` - объект `ThreadWithCommentsDTO` (тема с комментариями)
- `404 Not Found` - тема не найдена

**Пример запроса:**
```javascript
const threadId = '123e4567-e89b-12d3-a456-426614174000';
const response = await fetch(`https://localhost:7042/threads/${threadId}/`, {
  credentials: 'include'
});

const thread = await response.json();
```

#### Создать тему

**Endpoint:** `POST /threads/`

**Требует аутентификации:** Да

**Request Body:**
```json
{
  "title": "string",
  "context": "string"
}
```

**Response:**
- `200 OK` - тема успешно создана
- `400 Bad Request` - ошибки валидации
- `401 Unauthorized` - требуется аутентификация

**Пример запроса:**
```javascript
const response = await fetch('https://localhost:7042/threads/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    title: 'Новая тема для обсуждения',
    context: 'Описание темы и контекст обсуждения'
  })
});
```

#### Обновить тему

**Endpoint:** `PUT /threads/{id}/`

**Требует аутентификации:** Да

**Path Parameters:**
- `id` - GUID темы

**Request Body:**
```json
{
  "threadId": "guid",
  "title": "string",
  "context": "string"
}
```

**Важно:** `threadId` в теле запроса должен совпадать с `id` в URL.

**Response:**
- `200 OK` - тема успешно обновлена
- `400 Bad Request` - ошибки валидации или несоответствие ID
- `401 Unauthorized` - требуется аутентификация
- `403 Forbidden` - пользователь не является владельцем темы
- `404 Not Found` - тема не найдена

**Пример запроса:**
```javascript
const threadId = '123e4567-e89b-12d3-a456-426614174000';
const response = await fetch(`https://localhost:7042/threads/${threadId}/`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    threadId: threadId,
    title: 'Обновленный заголовок',
    context: 'Обновленное описание'
  })
});
```

#### Удалить тему

**Endpoint:** `DELETE /threads/{id}/`

**Требует аутентификации:** Да

**Path Parameters:**
- `id` - GUID темы

**Response:**
- `200 OK` - тема успешно удалена (помечена как удаленная)
- `401 Unauthorized` - требуется аутентификация
- `403 Forbidden` - пользователь не является владельцем темы
- `404 Not Found` - тема не найдена

**Пример запроса:**
```javascript
const threadId = '123e4567-e89b-12d3-a456-426614174000';
const response = await fetch(`https://localhost:7042/threads/${threadId}/`, {
  method: 'DELETE',
  credentials: 'include'
});
```

#### Восстановить тему

**Endpoint:** `PUT /threads/`

**Требует аутентификации:** Да

**Query Parameters:**
- `id` - GUID темы для восстановления

**Response:**
- `200 OK` - тема успешно восстановлена
- `401 Unauthorized` - требуется аутентификация
- `404 Not Found` - тема не найдена

**Пример запроса:**
```javascript
const threadId = '123e4567-e89b-12d3-a456-426614174000';
const response = await fetch(`https://localhost:7042/threads/?id=${threadId}`, {
  method: 'PUT',
  credentials: 'include'
});
```

#### Получить комментарии темы

**Endpoint:** `GET /threads/{threadId}/comments/`

**Требует аутентификации:** Нет

**Path Parameters:**
- `threadId` - GUID темы

**Query Parameters:**
- `after` (опционально) - DateTime в формате ISO 8601. Получить комментарии, созданные после указанной даты
- `limit` (опционально, по умолчанию 50) - максимальное количество комментариев для возврата

**Response:**
- `200 OK` - массив объектов `CommentResponseDTO`

**Пример запроса:**
```javascript
const threadId = '123e4567-e89b-12d3-a456-426614174000';
const response = await fetch(`https://localhost:7042/threads/${threadId}/comments/?limit=50`, {
  credentials: 'include'
});

const comments = await response.json();
```

### Комментарии (Comments)

#### Получить комментарий по ID

**Endpoint:** `GET /comments/{id}/`

**Требует аутентификации:** Нет

**Path Parameters:**
- `id` - GUID комментария

**Response:**
- `200 OK` - объект `CommentResponseDTO`
- `404 Not Found` - комментарий не найден

**Пример запроса:**
```javascript
const commentId = '123e4567-e89b-12d3-a456-426614174000';
const response = await fetch(`https://localhost:7042/comments/${commentId}/`, {
  credentials: 'include'
});

const comment = await response.json();
```

#### Создать комментарий

**Endpoint:** `POST /comments/`

**Требует аутентификации:** Да

**Request Body:**
```json
{
  "content": "string",
  "threadId": "guid",
  "parentCommentId": "guid | null"
}
```

**Поля:**
- `content` (обязательно) - текст комментария
- `threadId` (обязательно) - GUID темы
- `parentCommentId` (опционально) - GUID родительского комментария для создания ответа. Если `null`, создается корневой комментарий

**Response:**
- `200 OK` - комментарий успешно создан
- `400 Bad Request` - ошибки валидации
- `401 Unauthorized` - требуется аутентификация
- `404 Not Found` - тема или пользователь не найдены

**Пример запроса:**
```javascript
// Создать корневой комментарий
const response = await fetch('https://localhost:7042/comments/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    content: 'Это мой комментарий к теме',
    threadId: '123e4567-e89b-12d3-a456-426614174000',
    parentCommentId: null
  })
});

// Создать ответ на комментарий
const response = await fetch('https://localhost:7042/comments/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    content: 'Это ответ на комментарий',
    threadId: '123e4567-e89b-12d3-a456-426614174000',
    parentCommentId: '987e6543-e21b-43d2-b654-426614174999'
  })
});
```

#### Обновить комментарий

**Endpoint:** `PUT /comments/{id}/`

**Требует аутентификации:** Да

**Path Parameters:**
- `id` - GUID комментария

**Request Body:**
```json
{
  "commentId": "guid",
  "content": "string"
}
```

**Важно:** `commentId` в теле запроса должен совпадать с `id` в URL.

**Response:**
- `200 OK` - комментарий успешно обновлен
- `400 Bad Request` - ошибки валидации или несоответствие ID
- `401 Unauthorized` - требуется аутентификация
- `403 Forbidden` - пользователь не является автором комментария
- `404 Not Found` - комментарий не найден

**Пример запроса:**
```javascript
const commentId = '123e4567-e89b-12d3-a456-426614174000';
const response = await fetch(`https://localhost:7042/comments/${commentId}/`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    commentId: commentId,
    content: 'Обновленный текст комментария'
  })
});
```

#### Удалить комментарий

**Endpoint:** `DELETE /comments/{id}/`

**Требует аутентификации:** Да

**Path Parameters:**
- `id` - GUID комментария

**Response:**
- `200 OK` - комментарий успешно удален (помечен как удаленный)
- `401 Unauthorized` - требуется аутентификация
- `403 Forbidden` - пользователь не является автором комментария
- `404 Not Found` - комментарий не найден

**Пример запроса:**
```javascript
const commentId = '123e4567-e89b-12d3-a456-426614174000';
const response = await fetch(`https://localhost:7042/comments/${commentId}/`, {
  method: 'DELETE',
  credentials: 'include'
});
```

### Профиль пользователя (Profile)

#### Получить профиль пользователя

**Endpoint:** `GET /profile/`

**Требует аутентификации:** Нет (но если не указан `id`, вернется профиль текущего пользователя, если он аутентифицирован)

**Query Parameters:**
- `id` (опционально) - GUID пользователя. Если не указан и пользователь аутентифицирован, возвращается профиль текущего пользователя

**Response:**
- `200 OK` - объект `CommonUserDataDTO`
- `404 Not Found` - пользователь не найден

**Пример запроса:**
```javascript
// Получить профиль конкретного пользователя
const userId = '123e4567-e89b-12d3-a456-426614174000';
const response = await fetch(`https://localhost:7042/profile/?id=${userId}`, {
  credentials: 'include'
});

// Получить свой профиль (если аутентифицирован)
const response = await fetch('https://localhost:7042/profile/', {
  credentials: 'include'
});

const profile = await response.json();
```

#### Обновить аватар пользователя

**Endpoint:** `PUT /profile/avatar/`

**Требует аутентификации:** Да

**Request Body:**
```json
{
  "avatarId": 0
}
```

**Поля:**
- `avatarId` (обязательно) - ID аватара (byte, 0-255)

**Response:**
- `200 OK` - аватар успешно обновлен
- `400 Bad Request` - ошибки валидации
- `401 Unauthorized` - требуется аутентификация

**Пример запроса:**
```javascript
const response = await fetch('https://localhost:7042/profile/avatar/', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    avatarId: 5
  })
});
```

---

## Структуры данных

### Request DTOs

#### UserRegisterDto
```typescript
interface UserRegisterDto {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  homePage?: string | null;
}
```

#### UserLoginDto
```typescript
interface UserLoginDto {
  email: string;
  password: string;
}
```

#### ThreadCreateDTO
```typescript
interface ThreadCreateDTO {
  title: string;
  context: string;
}
```

#### ThreadUpdateDTO
```typescript
interface ThreadUpdateDTO {
  threadId: string; // GUID
  title: string;
  context: string;
}
```

#### CommentCreateDTO
```typescript
interface CommentCreateDTO {
  content: string;
  threadId: string; // GUID
  parentCommentId?: string | null; // GUID, опционально для ответов
}
```

#### CommentUpdateDTO
```typescript
interface CommentUpdateDTO {
  commentId: string; // GUID
  content: string;
}
```

#### UserUpdateAvatarDTO
```typescript
interface UserUpdateAvatarDTO {
  avatarId: number; // byte (0-255)
}
```

### Response DTOs

#### ThreadsThreeDTOResponce
```typescript
interface ThreadsThreeDTOResponce {
  id: string; // GUID
  title: string;
  content: string;
  createdAt: string; // ISO 8601 DateTime
  commentCount: number;
}
```

#### ThreadResponseDTO
```typescript
interface ThreadResponseDTO {
  id: string; // GUID
  title: string;
  context: string;
  ownerId: string; // GUID
  ownerUserName: string;
  createdAt: string; // ISO 8601 DateTime
  lastUpdatedAt?: string | null; // ISO 8601 DateTime
  commentCount: number;
}
```

#### ThreadWithCommentsDTO
```typescript
interface ThreadWithCommentsDTO extends ThreadResponseDTO {
  comments: CommentResponseDTO[];
}
```

#### CommentResponseDTO
```typescript
interface CommentResponseDTO {
  id: string; // GUID
  content: string;
  createdAt: string; // ISO 8601 DateTime
  updatedAt?: string | null; // ISO 8601 DateTime
  threadId: string; // GUID
  parentCommentId?: string | null; // GUID
  userId: string; // GUID
  userName: string;
  avatarTumbnailUrl?: string | null;
}
```

#### CommentTreeDTO
```typescript
interface CommentTreeDTO extends CommentResponseDTO {
  replies: CommentTreeDTO[]; // Дочерние комментарии
}
```

#### CommonUserDataDTO
```typescript
interface CommonUserDataDTO {
  userName: string;
  avatarTumbnailUrl: string;
  createdAt: string; // ISO 8601 DateTime
  homePage: string;
  lastActive?: string | null; // ISO 8601 DateTime
  threads: ThreadResponseDTO[];
}
```

#### JwtTokenDTO
```typescript
interface JwtTokenDTO {
  access_Token: string;
  refresh_Token: string;
  expires_In: number; // секунды
}
```

**Примечание:** JWT токены обычно не возвращаются в ответах, так как они устанавливаются в HTTP-only cookies автоматически.

---

## Примеры использования

### Полный пример работы с API

```javascript
// Конфигурация
const API_BASE_URL = 'https://localhost:7042';

// Вспомогательная функция для запросов
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Регистрация
async function register(userData) {
  return apiRequest('/api/auth/register/', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

// Вход
async function login(email, password) {
  return apiRequest('/api/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// Выход
async function logout() {
  return apiRequest('/api/auth/logout/', {
    method: 'POST',
  });
}

// Получить список тем
async function getThreads(after = null, limit = 20) {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (after) {
    params.append('after', after.toISOString());
  }
  return apiRequest(`/threads/?${params.toString()}`);
}

// Получить тему с комментариями
async function getThread(threadId) {
  return apiRequest(`/threads/${threadId}/`);
}

// Создать тему
async function createThread(title, context) {
  return apiRequest('/threads/', {
    method: 'POST',
    body: JSON.stringify({ title, context }),
  });
}

// Обновить тему
async function updateThread(threadId, title, context) {
  return apiRequest(`/threads/${threadId}/`, {
    method: 'PUT',
    body: JSON.stringify({ threadId, title, context }),
  });
}

// Удалить тему
async function deleteThread(threadId) {
  return apiRequest(`/threads/${threadId}/`, {
    method: 'DELETE',
  });
}

// Получить комментарии темы
async function getThreadComments(threadId, after = null, limit = 50) {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (after) {
    params.append('after', after.toISOString());
  }
  return apiRequest(`/threads/${threadId}/comments/?${params.toString()}`);
}

// Создать комментарий
async function createComment(content, threadId, parentCommentId = null) {
  return apiRequest('/comments/', {
    method: 'POST',
    body: JSON.stringify({ content, threadId, parentCommentId }),
  });
}

// Обновить комментарий
async function updateComment(commentId, content) {
  return apiRequest(`/comments/${commentId}/`, {
    method: 'PUT',
    body: JSON.stringify({ commentId, content }),
  });
}

// Удалить комментарий
async function deleteComment(commentId) {
  return apiRequest(`/comments/${commentId}/`, {
    method: 'DELETE',
  });
}

// Получить профиль
async function getProfile(userId = null) {
  const params = userId ? new URLSearchParams({ id: userId }) : '';
  return apiRequest(`/profile/${params ? '?' + params.toString() : ''}`);
}

// Обновить аватар
async function updateAvatar(avatarId) {
  return apiRequest('/profile/avatar/', {
    method: 'PUT',
    body: JSON.stringify({ avatarId }),
  });
}

// Пример использования
(async () => {
  try {
    // Регистрация
    await register({
      userName: 'JohnDoe',
      email: 'john@example.com',
      password: 'SecurePassword123',
      confirmPassword: 'SecurePassword123',
      homePage: 'https://johndoe.com'
    });

    // Вход
    await login('john@example.com', 'SecurePassword123');

    // Получить список тем
    const threads = await getThreads(null, 20);
    console.log('Threads:', threads);

    // Создать тему
    const newThread = await createThread(
      'Новая тема',
      'Описание новой темы'
    );
    console.log('Created thread:', newThread);

    // Создать комментарий
    const comment = await createComment(
      'Мой первый комментарий',
      newThread.id,
      null
    );
    console.log('Created comment:', comment);

    // Получить профиль
    const profile = await getProfile();
    console.log('Profile:', profile);

    // Выход
    await logout();
  } catch (error) {
    console.error('Error:', error);
  }
})();
```

### Пример работы с древовидной структурой комментариев

```javascript
// Функция для построения дерева комментариев из плоского списка
function buildCommentTree(comments) {
  const commentMap = new Map();
  const rootComments = [];

  // Создаем карту всех комментариев
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Строим дерево
  comments.forEach(comment => {
    const commentNode = commentMap.get(comment.id);
    if (comment.parentCommentId) {
      const parent = commentMap.get(comment.parentCommentId);
      if (parent) {
        parent.replies.push(commentNode);
      }
    } else {
      rootComments.push(commentNode);
    }
  });

  return rootComments;
}

// Использование
async function displayThreadWithComments(threadId) {
  const thread = await getThread(threadId);
  const comments = await getThreadComments(threadId);
  
  // Преобразуем плоский список в дерево
  const commentTree = buildCommentTree(comments);
  
  console.log('Thread:', thread);
  console.log('Comment tree:', commentTree);
  
  // Теперь можно отобразить комментарии в виде дерева
  renderCommentTree(commentTree);
}

function renderCommentTree(comments, depth = 0) {
  comments.forEach(comment => {
    const indent = '  '.repeat(depth);
    console.log(`${indent}- ${comment.userName}: ${comment.content}`);
    
    if (comment.replies && comment.replies.length > 0) {
      renderCommentTree(comment.replies, depth + 1);
    }
  });
}
```

### Пример пагинации

```javascript
// Пагинация для списка тем
async function getAllThreadsWithPagination() {
  let allThreads = [];
  let after = null;
  const limit = 20;
  let hasMore = true;

  while (hasMore) {
    const threads = await getThreads(after, limit);
    
    if (threads.length === 0) {
      hasMore = false;
    } else {
      allThreads = allThreads.concat(threads);
      // Используем дату создания последней темы для следующего запроса
      after = new Date(threads[threads.length - 1].createdAt);
      
      // Если получили меньше запрошенного количества, значит это последняя страница
      if (threads.length < limit) {
        hasMore = false;
      }
    }
  }

  return allThreads;
}
```

---

## Обработка ошибок

### Коды состояния HTTP

API использует стандартные HTTP коды состояния:

- `200 OK` - запрос успешно выполнен
- `400 Bad Request` - ошибка валидации или неверный формат запроса
- `401 Unauthorized` - требуется аутентификация или неверные учетные данные
- `403 Forbidden` - недостаточно прав для выполнения операции
- `404 Not Found` - ресурс не найден
- `500 Internal Server Error` - внутренняя ошибка сервера

### Формат ошибок

Ошибки обычно возвращаются в следующем формате:

```json
{
  "message": "Описание ошибки"
}
```

Или для ошибок валидации:

```json
{
  "errors": [
    {
      "propertyName": "email",
      "errorMessage": "Email is required"
    }
  ]
}
```

### Пример обработки ошибок

```javascript
async function handleApiRequest(requestFn) {
  try {
    const result = await requestFn();
    return { success: true, data: result };
  } catch (error) {
    if (error.response) {
      // Ошибка от API
      const status = error.response.status;
      const errorData = await error.response.json().catch(() => ({}));
      
      switch (status) {
        case 400:
          return { success: false, error: 'Ошибка валидации', details: errorData };
        case 401:
          return { success: false, error: 'Требуется авторизация' };
        case 403:
          return { success: false, error: 'Недостаточно прав' };
        case 404:
          return { success: false, error: 'Ресурс не найден' };
        default:
          return { success: false, error: 'Ошибка сервера', details: errorData };
      }
    } else {
      // Сетевая ошибка или другая ошибка
      return { success: false, error: error.message };
    }
  }
}

// Использование
const result = await handleApiRequest(() => createThread('Title', 'Context'));
if (result.success) {
  console.log('Thread created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Проверка аутентификации

```javascript
// Проверка, аутентифицирован ли пользователь
async function checkAuth() {
  try {
    const profile = await getProfile();
    return { authenticated: true, user: profile };
  } catch (error) {
    return { authenticated: false };
  }
}

// Использование
const authStatus = await checkAuth();
if (authStatus.authenticated) {
  console.log('User is logged in:', authStatus.user);
} else {
  console.log('User is not logged in');
  // Перенаправить на страницу входа
}
```

---

## Дополнительные замечания

### Валидация данных

- Все обязательные поля должны быть заполнены
- Email должен быть в правильном формате
- Пароли должны соответствовать требованиям безопасности (проверяйте на фронтенде перед отправкой)
- GUID должны быть в правильном формате

### Производительность

- Используйте пагинацию для больших списков
- Кэшируйте данные там, где это возможно
- Используйте debounce для поисковых запросов

### Безопасность

- Никогда не храните пароли в открытом виде
- Всегда используйте HTTPS в production
- Проверяйте права доступа перед выполнением операций
- Валидируйте все данные на клиенте перед отправкой

### Дата и время

Все даты и время возвращаются в формате ISO 8601 (UTC). Пример: `2024-01-15T10:30:00Z`

### GUID формат

Все идентификаторы используют формат GUID (UUID): `123e4567-e89b-12d3-a456-426614174000`

---

## Swagger документация

В режиме разработки доступна Swagger документация по адресу:
- `https://localhost:7042/swagger`

Swagger UI предоставляет интерактивную документацию API с возможностью тестирования эндпоинтов.

---

## Поддержка

При возникновении проблем или вопросов обращайтесь к разработчикам API или проверяйте логи сервера.

