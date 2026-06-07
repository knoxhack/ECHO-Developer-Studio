import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider } from '@/hooks/useAuth'
import { useStore } from '@/hooks/useStore'
import { useWorkspace } from '@/hooks/useWorkspace'
import { ToastProvider } from '@/components/ToastProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import type { Role } from '@/types'
import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'
import LoginGate from '@/pages/LoginGate'
import electronAPI from '@/lib/electronAPI'

const MissionControl = lazy(() => import('@/pages/MissionControl'))
const PlatformStack = lazy(() => import('@/pages/PlatformStack'))
const CoreModules = lazy(() => import('@/pages/CoreModules'))
const NativeRuntime = lazy(() => import('@/pages/NativeRuntime'))
const PackOS = lazy(() => import('@/pages/PackOS'))
const OfficialAddons = lazy(() => import('@/pages/OfficialAddons'))
const OfficialExperiences = lazy(() => import('@/pages/OfficialExperiences'))
const Launcher = lazy(() => import('@/pages/Launcher'))
const ReleaseManager = lazy(() => import('@/pages/ReleaseManager'))
const ReleaseDashboard = lazy(() => import('@/pages/ReleaseDashboard'))
const Signing = lazy(() => import('@/pages/Signing'))
const AddonReview = lazy(() => import('@/pages/AddonReview'))
const Diagnostics = lazy(() => import('@/pages/Diagnostics'))
const AIAgents = lazy(() => import('@/pages/AIAgents'))
const Terminal = lazy(() => import('@/pages/Terminal'))
const Settings = lazy(() => import('@/pages/Settings'))

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-echo-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
    >
      {children}
    </motion.div>
  )
}

function AppShell({ role, workspacePath, onLogout }: { role: Role; workspacePath: string | null; onLogout: () => void }) {
  const { scan, loading, error, rescan } = useWorkspace(workspacePath)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'r':
            e.preventDefault()
            rescan()
            break
          case 'b':
            e.preventDefault()
            navigate('/core-modules')
            break
          case 't':
            if (e.shiftKey) {
              e.preventDefault()
              navigate('/terminal')
            }
            break
          case '1':
            e.preventDefault()
            navigate('/')
            break
          case '2':
            e.preventDefault()
            navigate('/platform-stack')
            break
          case '3':
            e.preventDefault()
            navigate('/core-modules')
            break
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate, rescan])

  return (
    <AuthProvider role={role}>
      <div className="flex flex-col h-screen bg-echo-bg text-echo-text">
        <Header workspacePath={workspacePath} onRescan={rescan} onLogout={onLogout} scanLoading={loading} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <Suspense fallback={<LoadingFallback />}>
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<AnimatedPage><ErrorBoundary><MissionControl scan={scan} /></ErrorBoundary></AnimatedPage>} />
                  <Route path="/platform-stack" element={<AnimatedPage><ErrorBoundary><PlatformStack scan={scan} /></ErrorBoundary></AnimatedPage>} />
                  <Route path="/core-modules" element={<AnimatedPage><ErrorBoundary><CoreModules scan={scan} /></ErrorBoundary></AnimatedPage>} />
                  <Route path="/native-runtime" element={<AnimatedPage><ErrorBoundary><NativeRuntime scan={scan} /></ErrorBoundary></AnimatedPage>} />
                  <Route path="/packos" element={<AnimatedPage><ErrorBoundary><PackOS scan={scan} workspacePath={workspacePath} /></ErrorBoundary></AnimatedPage>} />
                  <Route path="/official-addons" element={<AnimatedPage><ErrorBoundary><OfficialAddons scan={scan} /></ErrorBoundary></AnimatedPage>} />
                  <Route path="/official-experiences" element={<AnimatedPage><ErrorBoundary><OfficialExperiences scan={scan} /></ErrorBoundary></AnimatedPage>} />
                  <Route path="/launcher" element={<AnimatedPage><ErrorBoundary><Launcher /></ErrorBoundary></AnimatedPage>} />
                  <Route path="/release-manager" element={<AnimatedPage><ErrorBoundary><ReleaseManager workspacePath={workspacePath} /></ErrorBoundary></AnimatedPage>} />
                  <Route path="/release-dashboard" element={<AnimatedPage><ErrorBoundary><ReleaseDashboard workspacePath={workspacePath} /></ErrorBoundary></AnimatedPage>} />
                  <Route path="/signing" element={<AnimatedPage><ErrorBoundary><Signing /></ErrorBoundary></AnimatedPage>} />
                  <Route path="/addon-review" element={<AnimatedPage><ErrorBoundary><AddonReview /></ErrorBoundary></AnimatedPage>} />
                  <Route path="/diagnostics" element={<AnimatedPage><ErrorBoundary><Diagnostics workspacePath={workspacePath} /></ErrorBoundary></AnimatedPage>} />
                  <Route path="/ai-agents" element={<AnimatedPage><ErrorBoundary><AIAgents workspacePath={workspacePath} /></ErrorBoundary></AnimatedPage>} />
                  <Route path="/terminal" element={<AnimatedPage><ErrorBoundary><Terminal workspacePath={workspacePath} /></ErrorBoundary></AnimatedPage>} />
                  <Route path="/settings" element={<AnimatedPage><ErrorBoundary><Settings onLogout={onLogout} /></ErrorBoundary></AnimatedPage>} />
                </Routes>
              </Suspense>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </AuthProvider>
  )
}

export default function App() {
  const { workspacePath: storedPath, lastRole } = useStore()
  const [loggedIn, setLoggedIn] = useState(false)
  const [activeRole, setActiveRole] = useState<Role>('viewer')
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null)

  useEffect(() => {
    if (storedPath.loaded && lastRole.loaded && lastRole.value && lastRole.value !== 'viewer') {
      setActiveRole(lastRole.value as Role)
      setActiveWorkspace(storedPath.value)
      setLoggedIn(true)
    }
  }, [storedPath.loaded, storedPath.value, lastRole.loaded, lastRole.value])

  const handleLogin = (role: Role, path: string | null) => {
    setActiveRole(role)
    setActiveWorkspace(path)
    setLoggedIn(true)
  }

  const handleLogout = async () => {
    await electronAPI.storeClear()
    window.location.reload()
  }

  return (
    <ToastProvider>
      {!loggedIn ? (
        <LoginGate onLogin={handleLogin} />
      ) : (
        <AppShell role={activeRole} workspacePath={activeWorkspace} onLogout={handleLogout} />
      )}
    </ToastProvider>
  )
}
