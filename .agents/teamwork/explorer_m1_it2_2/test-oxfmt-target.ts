interface AppErrorBoundaryProps {
  children: React.ReactNode
  onReset: () => void
}

interface AppErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }
}
