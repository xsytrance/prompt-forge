import { Routes, Route, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import Layout from './components/Layout'
import Home from './pages/Home'
import PromptLab from './pages/PromptLab'

const BountyDetailPage = () => <div className="p-8 text-center text-stone-700">Bounty Detail</div>
const CommunityPage = () => <div className="p-8 text-center text-stone-700">Community</div>
const ProfilePage = () => <div className="p-8 text-center text-stone-700">Profile</div>
const AdminPage = () => <div className="p-8 text-center text-stone-700">Admin</div>
const AuthPage = () => <div className="p-8 text-center text-stone-700">Auth</div>

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/bounty/:id" element={<BountyDetailPage />} />
          <Route path="/lab" element={<PromptLab />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <Layout>
      <AnimatedRoutes />
    </Layout>
  )
}
