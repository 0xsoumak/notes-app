import { useState } from 'react'
import { Outlet } from 'react-router'
import { Button } from '@/components/ui/Button'
import { SidebarIcon } from '@/components/ui/icons'
import { Sidebar } from './Sidebar'

/** Sidebar + routed content, the frame every page renders inside. */
export function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="flex h-full w-full overflow-hidden">
      {isSidebarOpen && <Sidebar />}

      <div className="relative flex min-w-0 flex-1 flex-col">
        <Button
          size="sm"
          onClick={() => setIsSidebarOpen((open) => !open)}
          aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          className="absolute top-3 left-3 z-10 w-7 px-0"
        >
          <SidebarIcon className="size-3.5" />
        </Button>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
