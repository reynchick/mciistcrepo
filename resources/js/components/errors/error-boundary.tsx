import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error } }
  componentDidCatch(error: Error, info: any) { console.error('ErrorBoundary caught', error, info) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border rounded-md bg-red-50 text-red-700">
          <div className="font-semibold mb-2">Dashboard crashed</div>
          <div className="text-sm">{String(this.state.error?.message || 'Unknown error')}</div>
        </div>
      )
    }
    return this.props.children
  }
}

