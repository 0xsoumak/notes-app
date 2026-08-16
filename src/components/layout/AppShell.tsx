import { useState } from 'react'
import { Outlet } from 'react-router'
import { IconButton } from '@/components/ui/IconButton'
import { SidebarIcon } from '@/components/ui/icons'
import { Sidebar } from './Sidebar'

/** Sidebar + routed content, the frame every page renders inside. */
export function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="flex h-full w-full overflow-hidden">
      {isSidebarOpen && <Sidebar />}

      <div className="relative flex min-w-0 flex-1 flex-col">
        <IconButton
          label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          onClick={() => setIsSidebarOpen((open) => !open)}
          className="absolute top-3 left-3 z-10"
        >
          <SidebarIcon className="size-4" />
        </IconButton>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
