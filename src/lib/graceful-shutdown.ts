import { log } from './logger'
import { closeConnections } from './database'

class GracefulShutdown {
  private isShuttingDown = false
  private connections = new Set<() => Promise<void>>()
  private activeRequests = new Set<string>()

  constructor() {
    // Only setup in Node.js environment (not in Edge Runtime)
    if (typeof process !== 'undefined' && process.on) {
      this.setupSignalHandlers()
    }
  }

  private setupSignalHandlers() {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'] as const

    signals.forEach(signal => {
      process.on(signal, () => {
        log.info(`Received ${signal}, starting graceful shutdown`)
        this.shutdown()
      })
    })

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      log.error('Uncaught exception', error)
      this.shutdown(1)
    })

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      log.error('Unhandled promise rejection', reason as Error, {
        promise: promise.toString()
      })
      this.shutdown(1)
    })
  }

  addConnection(cleanup: () => Promise<void>) {
    this.connections.add(cleanup)
    return () => this.connections.delete(cleanup)
  }

  trackRequest(requestId: string) {
    this.activeRequests.add(requestId)
    return () => this.activeRequests.delete(requestId)
  }

  isShutdown() {
    return this.isShuttingDown
  }

  getActiveRequests() {
    return this.activeRequests.size
  }

  async shutdown(exitCode = 0) {
    if (this.isShuttingDown) {
      return
    }

    this.isShuttingDown = true
    
    log.info('Starting graceful shutdown', {
      activeRequests: this.activeRequests.size,
      activeConnections: this.connections.size
    })

    try {
      // Wait for active requests to complete (with timeout)
      const maxWait = 10000 // 10 seconds
      const startTime = Date.now()

      while (this.activeRequests.size > 0 && (Date.now() - startTime) < maxWait) {
        log.info(`Waiting for ${this.activeRequests.size} active requests to complete`)
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      if (this.activeRequests.size > 0) {
        log.warn(`Forcefully closing ${this.activeRequests.size} remaining requests`)
      }

      // Close all connections
      await Promise.allSettled([
        ...Array.from(this.connections).map(cleanup => cleanup()),
        closeConnections() // Close database connections
      ])

      log.info('Graceful shutdown completed')

      // Exit process if in Node.js environment
      if (typeof process !== 'undefined' && process.exit) {
        process.exit(exitCode)
      }

    } catch (error) {
      log.error('Error during graceful shutdown', error as Error)
      
      if (typeof process !== 'undefined' && process.exit) {
        process.exit(1)
      }
    }
  }
}

export const gracefulShutdown = new GracefulShutdown()

// Middleware helper for tracking requests
export function withGracefulShutdown<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  requestId?: string
): T {
  return (async (...args: any[]) => {
    const id = requestId || crypto.randomUUID()
    
    if (gracefulShutdown.isShutdown()) {
      return new Response(JSON.stringify({
        error: 'Service is shutting down',
        code: 'SERVICE_UNAVAILABLE'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const cleanup = gracefulShutdown.trackRequest(id)
    
    try {
      return await handler(...args)
    } finally {
      cleanup()
    }
  }) as T
}