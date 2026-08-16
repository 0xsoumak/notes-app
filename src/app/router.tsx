import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { HomePage } from '@/pages/HomePage'
import { NotePage } from '@/pages/NotePage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        {/* Note ids are repo paths and contain slashes, so this must be a splat. */}
        <Route path="notes/*" element={<NotePage />} />
        {/* Settings is a dialog now, not a route — anything else, including an
            old bookmark to `/settings`, lands back on the note list. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
