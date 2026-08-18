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
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'url(/images/sky-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      />
      {showNav && <Navbar />}
      <main
        className={`pb-28 md:pb-12 lg:pb-16 px-2 sm:px-4 md:px-6 ${
          showNav ? 'pt-[var(--nav-h)]' : ''
        }`}
      >
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  )
}