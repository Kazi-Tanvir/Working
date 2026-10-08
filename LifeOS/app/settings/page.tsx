export default function SettingsPage() {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-display text-xl uppercase tracking-wider font-mono">SYS://SYSTEM_SETTINGS</h1>
      </div>
      <div className="glass-card p-12 text-center font-mono text-xs">
        <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>SETTINGS_OFFLINE</p>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          INTEGRATION_SCHEDULED_FOR_V2 // CONFIGURATION_LOCK
        </p>
      </div>
    </div>
  )
}
