import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { HomePage } from '@/pages/HomePage'
import { NotePage } from '@/pages/NotePage'
import { SettingsPage } from '@/pages/SettingsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="settings" element={<SettingsPage />} />
        {/* Note ids are repo paths and contain slashes, so this must be a splat. */}
        <Route path="notes/*" element={<NotePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
