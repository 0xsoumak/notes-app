import { useState, type FormEvent, type ReactNode } from 'react'
import { Select } from '@base-ui/react/select'
import { Button } from '@/components/ui/Button'
import { CaretDownIcon, CheckIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import {
  BRANCHES,
  buildConfig,
  DEFAULT_BRANCH,
  isRepoConfigured,
  REPO_NAME,
  REPO_OWNER,
  useSync,
  type Branch,
} from '@/features/workspace'

const FIELD_CLASS =
  'border-border-subtle bg-surface text-content focus:border-content-muted/50 w-full rounded-md border px-3 py-2 text-sm outline-none transition'

const BRANCH_ITEM_CLASS = cn(
  'flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1 text-sm outline-none',
  'text-content-muted data-highlighted:bg-surface-hover data-highlighted:text-content',
)

export function GitHubPanel() {
  const { config, status, error, disconnect, connect, sync } = useSync()

  const [token, setToken] = useState(() => config?.token ?? '')
  const [branch, setBranch] = useState<Branch>(() => config?.branch ?? DEFAULT_BRANCH)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await connect(buildConfig(token, branch))
      setSaved(true)
      void sync()
    } catch {
      // `error` from the context already carries the message.
    }
  }

  return (
    <div>
      <h2 className="text-content text-lg font-semibold">GitHub sync</h2>
      <p className="text-content-muted mt-1 text-sm">
        Notes are stored as <code>.md</code> files in{' '}
        {isRepoConfigured ? (
          <code>
            {REPO_OWNER}/{REPO_NAME}
          </code>
        ) : (
          'a repository'
        )}
        , mirroring the folder structure in the sidebar.
      </p>

      {!isRepoConfigured && (
        <p className="mt-4 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          No repository is set for this build. Define <code>VITE_GITHUB_OWNER</code> and{' '}
          <code>VITE_GITHUB_REPO</code> in <code>.env</code>, then rebuild.
        </p>
      )}

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-4">
        <Field label="Personal access token" hint="Fine-grained token with Contents: Read and write.">
          <input
            type="password"
            value={token}
            onChange={(event) => {
              setToken(event.target.value)
              setSaved(false)
            }}
            placeholder="github_pat_…"
            autoComplete="off"
            className={FIELD_CLASS}
          />
        </Field>

        <Field label="Branch">
          <Select.Root
            value={branch}
            onValueChange={(value) => {
              setBranch(value ?? DEFAULT_BRANCH)
              setSaved(false)
            }}
          >
            <Select.Trigger className={cn(FIELD_CLASS, 'flex cursor-pointer items-center justify-between gap-2 text-left')}>
              <Select.Value />
              <Select.Icon className="text-content-muted flex">
                <CaretDownIcon className="size-4" />
              </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
              <Select.Positioner sideOffset={4} alignItemWithTrigger={false} className="z-50">
                <Select.Popup className="bg-surface border-border-subtle min-w-(--anchor-width) rounded-xl border p-1 shadow-lg shadow-black/20 outline-none">
                  {BRANCHES.map((name) => (
                    <Select.Item key={name} value={name} className={BRANCH_ITEM_CLASS}>
                      <Select.ItemIndicator className="flex size-4 shrink-0">
                        <CheckIcon className="size-4" />
                      </Select.ItemIndicator>
                      <Select.ItemText>{name}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </Field>

        {error && (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {saved && !error && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Connected. Syncing now…
          </p>
        )}

        <div className="flex flex-col items-stretch gap-2 pt-2 sm:flex-row sm:items-center">
          <Button type="submit" variant="primary" disabled={status === 'syncing' || !isRepoConfigured}>
            {status === 'syncing' ? 'Checking…' : 'Connect'}
          </Button>
          {config && (
            <Button onClick={() => void disconnect()}>Disconnect and clear local data</Button>
          )}
        </div>
      </form>

      <p className="text-content-muted mt-8 text-xs">
        The token is kept in this browser's localStorage and sent only to api.github.com. Anyone
        with access to this browser profile can read it.
      </p>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-content mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-content-muted mt-1 block text-xs">{hint}</span>}
    </label>
  )
}
