export default function Toasts({ toasts }) {
  if (!toasts.length) return null
  const styles = {
    info: 'border-brand-blue/60 bg-navy-800',
    warn: 'border-brand-yellow/60 bg-navy-800',
    urgent: 'border-brand-red/70 bg-brand-red/15',
  }
  const dot = { info: 'bg-brand-blue', warn: 'bg-brand-yellow', urgent: 'bg-brand-red' }
  return (
    <div className="fixed bottom-4 right-4 z-[60] space-y-2 max-w-xs w-full">
      {toasts.map(t => (
        <div key={t.id} className={'toast-in border rounded-xl px-4 py-3 shadow-2xl flex items-start gap-2.5 ' + (styles[t.type] || styles.info)}>
          <span className={'w-2 h-2 rounded-full mt-1.5 shrink-0 ' + (dot[t.type] || dot.info)} />
          <span className="text-sm text-slate-100">{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
