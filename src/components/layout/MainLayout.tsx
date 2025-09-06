import React from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { 
  Building2, 
  User, 
  DollarSign, 
  Layers, 
  Camera, 
  FileText, 
  Settings, 
  PenTool, 
  Database, 
  FileCheck,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const tabs = [
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'hiree', label: 'Hiree', icon: User },
  { id: 'flat', label: 'Services — Flat', icon: DollarSign },
  { id: 'tiered', label: 'Services — Sq.ft Tiers', icon: Layers },
  { id: 'gear', label: 'Gear', icon: Camera },
  { id: 'offer', label: 'Offer/Acceptance', icon: FileText },
  { id: 'templates', label: 'Templates', icon: Settings },
  { id: 'sign', label: 'Signatures', icon: PenTool },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'docs', label: 'Documents', icon: FileCheck },
]

interface MainLayoutProps {
  children: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { activeTab, setActiveTab } = useAppStore()
  const { signOut, user } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-xl">
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Solution Gate Media</h1>
              <p className="text-sm text-gray-600">Onboarding Docs Builder</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-[220px_1fr] gap-6">
          {/* Sidebar */}
          <div className="space-y-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      tab-button w-full flex items-center gap-3 text-left
                      ${isActive ? 'tab-button-active' : 'tab-button-inactive'}
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="min-h-[600px]">
            <Card className="h-full">
              <CardContent className="p-0">
                {children}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
