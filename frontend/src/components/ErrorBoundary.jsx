import { Component } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[40vh] flex items-center justify-center px-6">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-red-500/10 border border-red-500/20">
              <FiAlertTriangle size={24} className="text-red-400" />
            </div>
            <p className="text-white font-semibold">Something went wrong</p>
            <p className="text-gray-500 text-sm">
              {this.props.fallbackMessage || 'This section failed to load.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="btn-secondary text-sm inline-flex"
            >
              <FiRefreshCw size={13} /> Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
