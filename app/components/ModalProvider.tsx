'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { CheckCircle2, AlertOctagon, AlertTriangle, HelpCircle, Loader2, ArrowUpRight, RefreshCw, X } from 'lucide-react'
import { getExplorerAddressLink } from '@/lib/utils'

export type ModalType = 'confirm' | 'loading' | 'success' | 'error' | 'warning' | 'blockchain'

export type BlockchainStatus = 'pending' | 'confirming' | 'success' | 'failed' | 'timeout' | 'rejected'

export interface ModalConfig {
  type: ModalType
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  loadingText?: string
  txHash?: string
  blockchainStatus?: BlockchainStatus
  retryAction?: () => void | Promise<void>
  showCloseButton?: boolean
  autoCloseMs?: number
}

interface ModalContextType {
  showModal: (config: ModalConfig) => void
  hideModal: () => void
  updateModal: (config: Partial<ModalConfig>) => void
  modalConfig: ModalConfig | null
  isOpen: boolean
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export const useModal = () => {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [queue, setQueue] = useState<ModalConfig[]>([])

  const showModal = useCallback((config: ModalConfig) => {
    setQueue((prev) => {
      // If modal is open, push to queue, else open immediately
      if (isOpen) {
        return [...prev, config]
      } else {
        setModalConfig(config)
        setIsOpen(true)
        setIsActionLoading(false)
        return prev
      }
    })
  }, [isOpen])

  const hideModal = useCallback(() => {
    setIsOpen(false)
    setIsActionLoading(false)
    
    // Smooth transition delay before loading next item in queue
    setTimeout(() => {
      setModalConfig(null)
      setQueue((prev) => {
        if (prev.length > 0) {
          const next = prev[0]
          setModalConfig(next)
          setIsOpen(true)
          return prev.slice(1)
        }
        return prev
      })
    }, 200)
  }, [])

  const updateModal = useCallback((updates: Partial<ModalConfig>) => {
    setModalConfig((prev) => {
      if (!prev) return null
      return { ...prev, ...updates }
    })
  }, [])

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && modalConfig && modalConfig.type !== 'loading') {
        hideModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, modalConfig, hideModal])

  // Handle Auto Close
  useEffect(() => {
    if (isOpen && modalConfig?.autoCloseMs) {
      const timer = setTimeout(() => {
        hideModal()
      }, modalConfig.autoCloseMs)
      return () => clearTimeout(timer)
    }
  }, [isOpen, modalConfig, hideModal])

  const handleConfirm = async () => {
    if (!modalConfig || !modalConfig.onConfirm) return
    try {
      setIsActionLoading(true)
      await modalConfig.onConfirm()
      // If it doesn't transition to success or close, close it here
      setIsActionLoading(false)
      hideModal()
    } catch (err) {
      setIsActionLoading(false)
      // Transition to error modal
      showModal({
        type: 'error',
        title: 'Transaction Failed',
        message: err instanceof Error ? err.message : 'An unexpected error occurred during execution.',
        retryAction: modalConfig.onConfirm
      })
    }
  }

  const handleCancel = () => {
    if (modalConfig?.onCancel) {
      modalConfig.onCancel()
    }
    hideModal()
  }

  return (
    <ModalContext.Provider value={{ showModal, hideModal, updateModal, modalConfig, isOpen }}>
      {children}
      
      {/* Modal Overlay Portalled DOM */}
      {modalConfig && (
        <div 
          className={`modal-overlay ${isOpen ? 'active' : ''}`}
          onClick={() => {
            if (modalConfig.type !== 'loading' && modalConfig.type !== 'blockchain') {
              handleCancel()
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(3, 7, 18, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isOpen ? 1 : 0,
            transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            padding: 16
          }}
        >
          {/* Modal Container */}
          <div 
            className={`modal-card ${isOpen ? 'active' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--ff-surface)',
              border: '1px solid var(--ff-border)',
              borderRadius: 'var(--ff-radius-md)',
              width: '100%',
              maxWidth: 460,
              padding: 24,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 24px rgba(56, 189, 248, 0.05)',
              transform: isOpen ? 'scale(1)' : 'scale(0.95)',
              opacity: isOpen ? 1 : 0,
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative'
            }}
          >
            {/* Close Button */}
            {modalConfig.showCloseButton && modalConfig.type !== 'loading' && (
              <button 
                onClick={handleCancel}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: 16,
                  background: 'none',
                  border: 'none',
                  color: 'var(--ff-text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all var(--ff-transition)'
                }}
                className="close-hover"
              >
                <X size={16} />
              </button>
            )}

            {/* Icon Banner */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              {modalConfig.type === 'success' && (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: 12, borderRadius: '50%' }}>
                  <CheckCircle2 size={32} color="#10b981" />
                </div>
              )}
              {modalConfig.type === 'error' && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 12, borderRadius: '50%' }}>
                  <AlertOctagon size={32} color="#ef4444" />
                </div>
              )}
              {modalConfig.type === 'warning' && (
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: 12, borderRadius: '50%' }}>
                  <AlertTriangle size={32} color="#f59e0b" />
                </div>
              )}
              {modalConfig.type === 'confirm' && (
                <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: 12, borderRadius: '50%' }}>
                  <HelpCircle size={32} color="var(--ff-primary)" />
                </div>
              )}
              {modalConfig.type === 'loading' && (
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: 12, borderRadius: '50%' }}>
                  <Loader2 size={32} color="#6366f1" className="spin" />
                </div>
              )}
              {modalConfig.type === 'blockchain' && (
                <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: 12, borderRadius: '50%' }}>
                  {modalConfig.blockchainStatus === 'pending' || modalConfig.blockchainStatus === 'confirming' ? (
                    <Loader2 size={32} color="var(--ff-primary)" className="spin" />
                  ) : modalConfig.blockchainStatus === 'success' ? (
                    <CheckCircle2 size={32} color="#10b981" />
                  ) : modalConfig.blockchainStatus === 'rejected' ? (
                    <HelpCircle size={32} color="#f59e0b" />
                  ) : (
                    <AlertOctagon size={32} color="#ef4444" />
                  )}
                </div>
              )}
            </div>

            {/* Typography Content */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                {modalConfig.title}
              </h3>
              <p style={{ color: 'var(--ff-text-secondary)', fontSize: 13.5, lineHeight: 1.6 }}>
                {modalConfig.message}
              </p>

              {/* Loading Status Subtext */}
              {modalConfig.type === 'loading' && modalConfig.loadingText && (
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ff-text-muted)', fontStyle: 'italic' }}>
                  {modalConfig.loadingText}
                </div>
              )}

              {/* Blockchain Transasction Panel */}
              {modalConfig.type === 'blockchain' && (
                <div style={{ marginTop: 16, background: '#0a0a0c', border: '1px solid var(--ff-border-subtle)', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                    <span style={{ color: 'var(--ff-text-muted)' }}>Status:</span>
                    <span style={{ 
                      fontWeight: 600, 
                      color: modalConfig.blockchainStatus === 'success' ? '#10b981' : 
                             modalConfig.blockchainStatus === 'failed' ? '#ef4444' : 
                             modalConfig.blockchainStatus === 'rejected' ? '#f59e0b' : 'var(--ff-primary)' 
                    }}>
                      {modalConfig.blockchainStatus ? modalConfig.blockchainStatus.toUpperCase() : 'PENDING'}
                    </span>
                  </div>
                  {modalConfig.txHash && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                      <span style={{ color: 'var(--ff-text-muted)' }}>Transaction:</span>
                      <a 
                        href={`https://testnet.arcscan.app/tx/${modalConfig.txHash}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'var(--ff-primary)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                        className="hover-link"
                      >
                        <span>{modalConfig.txHash.slice(0, 6)}...{modalConfig.txHash.slice(-4)}</span>
                        <ArrowUpRight size={13} />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons Panel */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {modalConfig.type === 'confirm' && (
                <>
                  <button 
                    onClick={handleCancel}
                    className="btn btn-secondary"
                    disabled={isActionLoading}
                    style={{ flex: 1, height: 38, fontSize: 13 }}
                  >
                    {modalConfig.cancelText || 'Cancel'}
                  </button>
                  <button 
                    onClick={handleConfirm}
                    className="btn btn-primary"
                    disabled={isActionLoading}
                    style={{ flex: 1, height: 38, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    {isActionLoading && <Loader2 size={14} className="spin" />}
                    {modalConfig.confirmText || 'Confirm'}
                  </button>
                </>
              )}

              {modalConfig.type === 'error' && (
                <>
                  {modalConfig.retryAction && (
                    <button 
                      onClick={() => {
                        hideModal()
                        if (modalConfig.retryAction) modalConfig.retryAction()
                      }}
                      className="btn btn-primary"
                      style={{ flex: 1, height: 38, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <RefreshCw size={14} /> Retry
                    </button>
                  )}
                  <button 
                    onClick={handleCancel}
                    className="btn btn-secondary"
                    style={{ flex: modalConfig.retryAction ? 1 : 0, minWidth: 100, height: 38, fontSize: 13 }}
                  >
                    Dismiss
                  </button>
                </>
              )}

              {modalConfig.type === 'success' && (
                <button 
                  onClick={handleCancel}
                  className="btn btn-primary"
                  style={{ minWidth: 120, height: 38, fontSize: 13 }}
                >
                  Continue
                </button>
              )}

              {modalConfig.type === 'warning' && (
                <>
                  <button 
                    onClick={handleCancel}
                    className="btn btn-secondary"
                    style={{ flex: 1, height: 38, fontSize: 13 }}
                  >
                    Acknowledge
                  </button>
                  {modalConfig.onConfirm && (
                    <button 
                      onClick={handleConfirm}
                      className="btn btn-primary"
                      disabled={isActionLoading}
                      style={{ flex: 1, height: 38, fontSize: 13 }}
                    >
                      Proceed
                    </button>
                  )}
                </>
              )}

              {modalConfig.type === 'blockchain' && (
                <button 
                  onClick={handleCancel}
                  className="btn btn-secondary"
                  disabled={modalConfig.blockchainStatus === 'pending' || modalConfig.blockchainStatus === 'confirming'}
                  style={{ minWidth: 120, height: 38, fontSize: 13 }}
                >
                  {modalConfig.blockchainStatus === 'pending' || modalConfig.blockchainStatus === 'confirming' ? 'Processing...' : 'Close'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      <style jsx global>{`
        .spin {
          animation: modal-spin 1s linear infinite;
        }
        @keyframes modal-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .modal-overlay {
          pointer-events: none;
        }
        .modal-overlay.active {
          pointer-events: auto;
        }
        .close-hover:hover {
          background: rgba(255,255,255,0.05) !important;
          color: #fff !important;
        }
      `}</style>
    </ModalContext.Provider>
  )
}

/**
 * Maps standard API/wallet exceptions to user-friendly messages.
 */
export function mapErrorToFriendlyMessage(error: any): { title: string; message: string } {
  const errString = String(error?.message || error).toLowerCase()

  if (errString.includes('user rejected') || errString.includes('user denied')) {
    return {
      title: 'Request Cancelled',
      message: 'The transaction request was rejected in your wallet provider. No assets were moved.'
    }
  }

  if (errString.includes('insufficient funds') || errString.includes('exceeds balance')) {
    return {
      title: 'Insufficient Balance',
      message: 'You do not have enough USDC in your wallet to cover this transaction and its gas fees.'
    }
  }

  if (errString.includes('timeout') || errString.includes('exceeded time')) {
    return {
      title: 'Network Timeout',
      message: 'The request took too long to complete. Please check your internet connection and try again.'
    }
  }

  if (errString.includes('network') || errString.includes('failed to fetch')) {
    return {
      title: 'Connection Disconnected',
      message: 'Failed to establish connection to the Arc blockchain network. Please check your RPC endpoint.'
    }
  }

  return {
    title: 'Execution Failed',
    message: error?.message || 'An unknown error occurred during transaction broadcast.'
  }
}
