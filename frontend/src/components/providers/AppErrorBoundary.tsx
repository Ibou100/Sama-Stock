import React from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  errorCount: number
}

/**
 * Global error boundary that auto-recovers from React DOM reconciliation
 * errors (insertBefore / removeChild) caused by React Router v7 + React 19.
 */
export class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorCount: 0 }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, errorCount: 0 }
  }

  componentDidCatch(error: Error) {
    // Only auto-recover for known DOM reconciliation errors
    const isDomReconciliationError =
      error.message?.includes('insertBefore') ||
      error.message?.includes('removeChild') ||
      error.message?.includes('is not a child of this node')

    if (isDomReconciliationError && this.state.errorCount < 5) {
      // Auto-recover after a short delay
      setTimeout(() => {
        this.setState({ hasError: false, errorCount: this.state.errorCount + 1 })
      }, 50)
    }
  }

  render() {
    if (this.state.hasError) {
      // Show nothing briefly while recovering
      return null
    }
    return this.props.children
  }
}
