import { Component, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production this should report to a logging service
    // console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center max-w-md">
              <AlertTriangle className="w-10 h-10 text-echo-danger mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-echo-text mb-2">Something went wrong</h3>
              <p className="text-sm text-echo-muted mb-4">
                {this.state.error?.message || 'An unexpected error occurred.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-md bg-echo-accent/10 text-echo-accent text-sm font-medium hover:bg-echo-accent/20 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      )
    }
    return this.props.children
  }
}
