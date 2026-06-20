'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { ChevronRight, ChevronLeft, X, Play, HelpCircle } from 'lucide-react'

export interface TourStep {
  targetSelector?: string
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

interface OnboardingContextType {
  startTour: () => void
  skipTour: () => void
  currentStep: number
  isActive: boolean
  steps: TourStep[]
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export const useOnboarding = () => {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}

const FACTORFI_TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to FactorFi!',
    content: 'FactorFi is a decentralized reverse factoring protocol. Let\'s take a 60-second tour of the application and its main interfaces.',
    position: 'center'
  },
  {
    targetSelector: '[data-tour="connect-wallet"]',
    title: 'Connect Web3 Account',
    content: 'Authenticate instantly using standard ConnectButton or our gasless social-login option. Your address is screen-verified automatically.',
    position: 'bottom'
  },
  {
    targetSelector: '[data-tour="nav-tabs"]',
    title: 'Navigation Center',
    content: 'Switch between the core views of our reverse factoring network: Dashboard, Supplier portal, Anchor ledger, Investor pool, and CCTP Bridge.',
    position: 'bottom'
  },
  {
    targetSelector: '[data-tour="supply-finance"]',
    title: 'Supplier invoice factoring',
    content: 'SMEs can upload invoice attachments here. The AI Underwriter parses invoice metadata and signs them securely on-chain for instant payout.',
    position: 'top'
  },
  {
    targetSelector: '[data-tour="investor-vaults"]',
    title: 'Yield Lending Vaults',
    content: 'Liquidity providers can deposit USDC to earn real-world asset (RWA) factoring yields backed by corporate anchor repayments.',
    position: 'top'
  },
  {
    targetSelector: '[data-tour="bridge-assets"]',
    title: 'Cross-Chain USDC Bridge',
    content: 'Bridge USDC instantly from Base, Arbitrum, or Ethereum to Arc Testnet using Circle CCTP adapters with zero gas fee friction.',
    position: 'left'
  }
]

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const startTour = useCallback(() => {
    setCurrentStep(0)
    setIsActive(true)
    // Scroll window to top before starting
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const skipTour = useCallback(() => {
    setIsActive(false)
    localStorage.setItem('ff-tour-completed', 'true')
  }, [])

  // Check first time visitor detection
  useEffect(() => {
    const tourCompleted = localStorage.getItem('ff-tour-completed')
    if (!tourCompleted) {
      // Delay starting tour to allow provider and page assets to mount cleanly
      const timer = setTimeout(() => {
        startTour()
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [startTour])

  // Recalculate target elements dimensions and coordinates
  const updateHighlightCoords = useCallback(() => {
    if (!isActive) return

    const step = FACTORFI_TOUR_STEPS[currentStep]
    if (!step || !step.targetSelector) {
      setCoords(null)
      // Center position calculation
      setTooltipPos(null)
      return
    }

    const element = document.querySelector(step.targetSelector) as HTMLElement
    if (!element) {
      // Target element is currently hidden/not loaded (e.g. view tab hasn't been mounted yet).
      // Let's degrade gracefully to center tooltip
      setCoords(null)
      setTooltipPos(null)
      return
    }

    // Scroll target element into view slightly
    element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })

    // Wait a brief frame for scroll behavior to stabilize
    setTimeout(() => {
      const rect = element.getBoundingClientRect()
      const scrollY = window.scrollY
      const scrollX = window.scrollX

      const targetCoords = {
        top: rect.top + scrollY,
        left: rect.left + scrollX,
        width: rect.width,
        height: rect.height
      }

      setCoords(targetCoords)

      // Calculate Tooltip location
      if (tooltipRef.current) {
        const tooltipRect = tooltipRef.current.getBoundingClientRect()
        let tTop = targetCoords.top + targetCoords.height + 12
        let tLeft = targetCoords.left + (targetCoords.width / 2) - (tooltipRect.width / 2)

        // Boundary safety adjustments
        if (step.position === 'top') {
          tTop = targetCoords.top - tooltipRect.height - 12
        } else if (step.position === 'left') {
          tLeft = targetCoords.left - tooltipRect.width - 12
          tTop = targetCoords.top + (targetCoords.height / 2) - (tooltipRect.height / 2)
        } else if (step.position === 'right') {
          tLeft = targetCoords.left + targetCoords.width + 12
          tTop = targetCoords.top + (targetCoords.height / 2) - (tooltipRect.height / 2)
        }

        // Clamp values to prevent off-screen clip-off
        const pad = 16
        tLeft = Math.max(pad, Math.min(tLeft, window.innerWidth + scrollX - tooltipRect.width - pad))
        tTop = Math.max(pad, Math.min(tTop, document.documentElement.scrollHeight - tooltipRect.height - pad))

        setTooltipPos({ top: tTop, left: tLeft })
      }
    }, 150)
  }, [isActive, currentStep])

  // Hook layout metrics and window resize events
  useEffect(() => {
    if (isActive) {
      updateHighlightCoords()
      window.addEventListener('resize', updateHighlightCoords)
      window.addEventListener('scroll', updateHighlightCoords)
    }
    return () => {
      window.removeEventListener('resize', updateHighlightCoords)
      window.removeEventListener('scroll', updateHighlightCoords)
    }
  }, [isActive, currentStep, updateHighlightCoords])

  // Trigger coordinate re-render when tooltip ref mounts
  useEffect(() => {
    if (isActive && tooltipRef.current) {
      updateHighlightCoords()
    }
  }, [isActive, currentStep, updateHighlightCoords])

  const handleNext = () => {
    if (currentStep < FACTORFI_TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      skipTour()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const activeStepConfig = FACTORFI_TOUR_STEPS[currentStep]

  return (
    <OnboardingContext.Provider value={{ startTour, skipTour, currentStep, isActive, steps: FACTORFI_TOUR_STEPS }}>
      {children}

      {/* Onboarding HUD Overlay portal */}
      {isActive && activeStepConfig && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9998 }}>
          
          {/* Transparent Hole Shader Overlay */}
          {coords ? (
            <div
              style={{
                position: 'absolute',
                top: coords.top - 6,
                left: coords.left - 6,
                width: coords.width + 12,
                height: coords.height + 12,
                borderRadius: 8,
                boxShadow: '0 0 0 9999px rgba(3, 7, 18, 0.82)',
                border: '2px solid var(--ff-primary)',
                pointerEvents: 'auto',
                transition: 'all 0.2s ease'
              }}
            />
          ) : (
            // Full screen dim overlay if centered
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(3, 7, 18, 0.85)',
                backdropFilter: 'blur(4px)',
                pointerEvents: 'auto',
                transition: 'all 0.2s ease'
              }}
            />
          )}

          {/* Tooltip Card */}
          <div
            ref={tooltipRef}
            className="card"
            style={{
              position: 'absolute',
              top: tooltipPos ? tooltipPos.top : '50%',
              left: tooltipPos ? tooltipPos.left : '50%',
              transform: tooltipPos ? 'none' : 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: 360,
              background: 'var(--ff-surface)',
              border: '1px solid var(--ff-border)',
              borderRadius: 'var(--ff-radius-md)',
              padding: 20,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 16px rgba(56, 189, 248, 0.1)',
              pointerEvents: 'auto',
              zIndex: 9999,
              transition: tooltipPos ? 'all 0.2s ease' : 'none'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ff-primary)', letterSpacing: '0.05em' }}>
                Onboarding Step {currentStep + 1} of {FACTORFI_TOUR_STEPS.length}
              </span>
              <button 
                onClick={skipTour}
                style={{ background: 'none', border: 'none', color: 'var(--ff-text-muted)', cursor: 'pointer', padding: 2 }}
                className="close-hover"
              >
                <X size={14} />
              </button>
            </div>

            {/* Title & Body */}
            <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{activeStepConfig.title}</h4>
            <p style={{ fontSize: 13, color: 'var(--ff-text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>{activeStepConfig.content}</p>

            {/* Progress bar */}
            <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginBottom: 16, overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  background: 'var(--ff-primary)', 
                  width: `${((currentStep + 1) / FACTORFI_TOUR_STEPS.length) * 100}%`,
                  transition: 'width 0.2s ease'
                }} 
              />
            </div>

            {/* Actions Footer */}
            <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                onClick={skipTour} 
                style={{ background: 'none', border: 'none', color: 'var(--ff-text-muted)', fontSize: 12.5, cursor: 'pointer' }}
                className="skip-btn"
              >
                Skip Tour
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                {currentStep > 0 && (
                  <button 
                    onClick={handlePrev} 
                    className="btn btn-secondary" 
                    style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4, height: 30, fontSize: 12 }}
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                )}
                <button 
                  onClick={handleNext} 
                  className="btn btn-primary" 
                  style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4, height: 30, fontSize: 12 }}
                >
                  {currentStep === FACTORFI_TOUR_STEPS.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={14} />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      <style jsx global>{`
        .skip-btn:hover {
          color: #fff !important;
        }
      `}</style>
    </OnboardingContext.Provider>
  )
}
