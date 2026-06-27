import { Metadata } from 'next'
import DashboardLayoutClient from '@/components/dashboard/DashboardLayoutClient'

export const metadata: Metadata = {
  title: "Dashboard — Cognara",
  description: "Your personalised learning dashboard on Cognara. Track your progress, complete daily missions, and stay on the path to your goal.",
  robots: {
    index: false,
    follow: false,
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}
