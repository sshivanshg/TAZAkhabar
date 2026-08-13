import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { isAuthenticated } from './auth'
import { Layout } from './components/Layout'
import { ArticleEditorPage } from './pages/ArticleEditorPage'
import { DashboardPage } from './pages/DashboardPage'
import { IngestionLogsPage } from './pages/IngestionLogsPage'
import { LoginPage } from './pages/LoginPage'
import { ReviewQueuePage } from './pages/ReviewQueuePage'
import { SourcesPage } from './pages/SourcesPage'
import { UploadsPage } from './pages/UploadsPage'

function RequireAuth({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="review" element={<ReviewQueuePage />} />
        <Route path="uploads" element={<UploadsPage />} />
        <Route path="articles/new" element={<ArticleEditorPage />} />
        <Route path="articles/:id" element={<ArticleEditorPage />} />
        <Route path="sources" element={<SourcesPage />} />
        <Route path="logs" element={<IngestionLogsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
