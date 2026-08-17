import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { IconButton } from '@/components/ui/IconButton'
import { SearchIcon, SidebarIcon } from '@/components/ui/icons'
import { useCommandMenu } from '@/features/command-menu'
import { cn } from '@/lib/cn'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { Sidebar } from './Sidebar'

/** Matches Tailwind's `md` breakpoint, where the sidebar stops being a drawer. */
const DESKTOP_QUERY = '(min-width: 768px)'

/**
 * Sidebar + routed content, the frame every page renders inside.
 *
 * The sidebar is a resident panel on desktop and an overlay drawer below `md`,
 * where 256px of permanent chrome would leave no room to write.
 */
export function AppShell() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const [isSidebarOpen, setIsSidebarOpen] = useState(isDesktop)
  const { pathname } = useLocation()
  const commandMenu = useCommandMenu()

  // Crossing the breakpoint resets to that layout's natural state: open on
  // desktop, out of the way on mobile.
  useEffect(() => setIsSidebarOpen(isDesktop), [isDesktop])

  // Opening a note on mobile means the drawer has done its job.
  useEffect(() => {
    if (!isDesktop) setIsSidebarOpen(false)
  }, [pathname, isDesktop])

  useEffect(() => {
    if (isDesktop || !isSidebarOpen) return
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSidebarOpen(false)
    }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [isDesktop, isSidebarOpen])

  return (
    <div className="flex h-full w-full overflow-hidden">
      {isDesktop ? (
        isSidebarOpen && <Sidebar />
      ) : (
        <>
          <div
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
            className={cn(
              'fixed inset-0 z-20 bg-black/40 transition-opacity duration-200',
              isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Notes navigation"
            // Kept mounted so the panel slides rather than appearing, and so
            // the search box keeps its text between openings. `inert` takes it
            // out of the tab order while it is off-screen.
            inert={!isSidebarOpen}
            className={cn(
              'fixed inset-y-0 left-0 z-30 w-72 max-w-[85%] transition-transform duration-200 ease-out',
              isSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full',
            )}
          >
            <Sidebar onClose={() => setIsSidebarOpen(false)} />
          </div>
        </>
      )}

      <div className="relative flex min-w-0 flex-1 flex-col">
        {isDesktop ? (
          <IconButton
            label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            onClick={() => setIsSidebarOpen((open) => !open)}
            className="absolute top-3 left-3 z-10"
          >
            <SidebarIcon className="size-4" />
          </IconButton>
        ) : (
          // A real bar rather than a floating button: on a narrow screen an
          // overlaid control would sit on top of the note's title.
          <header className="border-border-subtle bg-surface flex h-12 shrink-0 items-center gap-2 border-b px-2">
            <IconButton
              label="Open navigation"
              onClick={() => setIsSidebarOpen(true)}
              className="size-8"
            >
              <SidebarIcon className="size-5" />
            </IconButton>
            <span className="text-content flex-1 text-sm font-semibold">Notes</span>
            <IconButton label="Search" onClick={commandMenu.open} className="size-8">
              <SearchIcon className="size-5" />
            </IconButton>
          </header>
        )}

        <main className="min-h-0 flex-1 overflow-x-clip overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
