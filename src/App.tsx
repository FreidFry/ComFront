import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout/Layout';
import { ThreadList } from './components/Threads/ThreadList';
import { ThreadDetail } from './components/Threads/ThreadDetail';
import { ThreadCreate } from './components/Threads/ThreadCreate';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { Profile } from './components/Profile/Profile';
import { ProfileEdit } from './components/Profile/ProfileEdit';
import { useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import './App.css';
import { EditThread } from './components/Threads/EditThread';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<ThreadList />} />
              <Route path="/threads/:id" element={<ThreadDetail />} />
              <Route
                path="/threads/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditThread />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/threads/new"
                element={
                  <ProtectedRoute>
                    <ThreadCreate />
                  </ProtectedRoute>
                }
                />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route
                path="/profile/edit"
                element={
                  <ProtectedRoute>
                    <ProfileEdit />
                  </ProtectedRoute>
                }
                />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;

