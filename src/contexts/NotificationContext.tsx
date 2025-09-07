import React, { createContext, useContext, useState, useCallback } from 'react'
import { Notification, type NotificationProps } from '../components/ui/Notification'

interface NotificationContextType {
  showNotification: (notification: Omit<NotificationProps, 'id'>) => void
  showSuccess: (title: string, message?: string, duration?: number) => void
  showError: (title: string, message?: string, duration?: number) => void
  showWarning: (title: string, message?: string, duration?: number) => void
  showInfo: (title: string, message?: string, duration?: number) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([])

  const showNotification = useCallback((notification: Omit<NotificationProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }
    
    setNotifications(prev => [...prev, newNotification])
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
    showNotification({ type: 'success', title, message, duration })
  }, [showNotification])

  const showError = useCallback((title: string, message?: string, duration?: number) => {
    showNotification({ type: 'error', title, message, duration })
  }, [showNotification])

  const showWarning = useCallback((title: string, message?: string, duration?: number) => {
    showNotification({ type: 'warning', title, message, duration })
  }, [showNotification])

  const showInfo = useCallback((title: string, message?: string, duration?: number) => {
    showNotification({ type: 'info', title, message, duration })
  }, [showNotification])

  const contextValue: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            {...notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}
