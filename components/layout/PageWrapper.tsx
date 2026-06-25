// components/layout/PageWrapper.tsx
import Navbar from './Navbar'
import BottomNav from './BottomNav'

interface PageWrapperProps {
  children: React.ReactNode
  showNav?: boolean
}

export default function PageWrapper({ 
  children, 
  showNav = true 
}: PageWrapperProps) {
  return (
    <div className="min-h-screen scanlines">
      {showNav && <Navbar />}
      <main className="pb-24 md:pb-8">
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  )
}