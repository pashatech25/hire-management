import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { LoginForm } from './components/auth/LoginForm'
import { MainLayout } from './components/layout/MainLayout'
import { CompanyTab } from './components/tabs/CompanyTab'
import { HireeTab } from './components/tabs/HireeTab'
import { FlatServicesTab } from './components/tabs/FlatServicesTab'
import { TieredServicesTab } from './components/tabs/TieredServicesTab'
import { GearTab } from './components/tabs/GearTab'
import { OfferTab } from './components/tabs/OfferTab'
import { TemplatesTab } from './components/tabs/TemplatesTab'
import { SignaturesTab } from './components/tabs/SignaturesTab'
import { DataTab } from './components/tabs/DataTab'
import { DocumentsTab } from './components/tabs/DocumentsTab'
import SignaturePage from './pages/SignaturePage'
import { useAppStore } from './store/useAppStore'

const AppContent: React.FC = () => {
  const { user, loading } = useAuth()
  const { activeTab } = useAppStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'company':
        return <CompanyTab />
      case 'hiree':
        return <HireeTab />
      case 'flat':
        return <FlatServicesTab />
      case 'tiered':
        return <TieredServicesTab />
      case 'gear':
        return <GearTab />
      case 'offer':
        return <OfferTab />
      case 'templates':
        return <TemplatesTab />
      case 'sign':
        return <SignaturesTab />
      case 'data':
        return <DataTab />
      case 'docs':
        return <DocumentsTab />
      default:
        return <CompanyTab />
    }
  }

  return (
    <MainLayout>
      {renderTabContent()}
    </MainLayout>
  )
}

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/sign/:token" element={<SignaturePage />} />
            <Route path="/*" element={<AppContent />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  )
}

export default App