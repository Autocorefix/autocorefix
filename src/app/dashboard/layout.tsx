import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar />
      <main className="ml-60 min-h-screen p-8">
        {children}
      </main>
    </div>
  )
}
