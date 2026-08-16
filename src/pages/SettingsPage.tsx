import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { DEFAULT_BRANCH, useSync, type GitHubConfig } from '@/features/workspace'

const FIELD_CLASS =
  'border-border-subtle bg-surface text-content focus:border-content-muted/50 w-full rounded-md border px-3 py-2 text-sm outline-none transition'

export function SettingsPage() {
  const { config, status, error, disconnect, connect, sync } = useSync()

  const [form, setForm] = useState<GitHubConfig>(
    () => config ?? { token: '', owner: '', repo: '', branch: DEFAULT_BRANCH },
  )
  const [saved, setSaved] = useState(false)

  const update = (field: keyof GitHubConfig) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setSaved(false)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await connect(form)
      setSaved(true)
      void sync()
    } catch {
      // `error` from the context already carries the message.
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-content text-2xl font-bold">GitHub sync</h1>
      <p className="text-content-muted mt-2 text-sm">
        Notes are stored as <code>.md</code> files in a repository you own, mirroring the folder
        structure in the sidebar.
      </p>

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-8 space-y-4">
        <Field label="Personal access token" hint="Fine-grained token with Contents: Read and write.">
          <input
            type="password"
            value={form.token}
            onChange={(event) => update('token')(event.target.value)}
            placeholder="github_pat_…"
            autoComplete="off"
            className={FIELD_CLASS}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Owner">
            <input
              value={form.owner}
              onChange={(event) => update('owner')(event.target.value)}
              placeholder="your-username"
              className={FIELD_CLASS}
            />
          </Field>
          <Field label="Repository">
            <input
              value={form.repo}
              onChange={(event) => update('repo')(event.target.value)}
              placeholder="my-notes"
              className={FIELD_CLASS}
            />
          </Field>
        </div>

        <Field label="Branch">
          <input
            value={form.branch}
            onChange={(event) => update('branch')(event.target.value)}
            placeholder={DEFAULT_BRANCH}
            className={FIELD_CLASS}
          />
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
          <Button type="submit" variant="primary" disabled={status === 'syncing'}>
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

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-content mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-content-muted mt-1 block text-xs">{hint}</span>}
    </label>
  )
}
