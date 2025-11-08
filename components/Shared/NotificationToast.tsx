"use client";
import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface Props {
  notification: ToastNotification | null;
  onClose: () => void;
}

export default function NotificationToast({ notification, onClose }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, notification.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        animation: isVisible ? 'slideIn 0.3s ease-out' : 'slideOut 0.3s ease-in',
        animationFillMode: 'forwards'
      }}
    >
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `}</style>
      
      <div
        style={{
          background: notification.type === 'success' ? '#dcfce7' : notification.type === 'error' ? '#fee2e2' : '#dbeafe',
          border: `1px solid ${notification.type === 'success' ? '#bbf7d0' : notification.type === 'error' ? '#fecaca' : '#bfdbfe'}`,
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          minWidth: '300px',
          maxWidth: '450px'
        }}
      >
        {notification.type === 'success' && (
          <CheckCircle2
            size={20}
            style={{
              color: '#16a34a',
              flexShrink: 0
            }}
          />
        )}
        <span
          style={{
            color: notification.type === 'success' ? '#166534' : notification.type === 'error' ? '#991b1b' : '#1e40af',
            fontSize: '0.95rem',
            fontWeight: '500',
            flex: 1
          }}
        >
          {notification.message}
        </span>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: notification.type === 'success' ? '#16a34a' : notification.type === 'error' ? '#dc2626' : '#2563eb',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
