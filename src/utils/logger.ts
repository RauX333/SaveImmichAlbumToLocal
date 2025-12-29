function serialize(args: unknown[]): string {
  return args.map((a) => {
    if (typeof a === 'string') return a
    try {
      return JSON.stringify(a)
    } catch {
      return String(a)
    }
  }).join(' ')
}

export function installConsoleBridge() {
  const origLog = console.log
  const origWarn = console.warn
  const origError = console.error
  console.log = (...args: unknown[]) => {
    origLog(...args)
    const msg = serialize(args)
    window.ipcRenderer.invoke('write-log', { level: 'INFO', message: msg })
  }
  console.warn = (...args: unknown[]) => {
    origWarn(...args)
    const msg = serialize(args)
    window.ipcRenderer.invoke('write-log', { level: 'WARN', message: msg })
  }
  console.error = (...args: unknown[]) => {
    origError(...args)
    const msg = serialize(args)
    window.ipcRenderer.invoke('write-log', { level: 'ERROR', message: msg })
  }
}
