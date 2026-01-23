'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Tenant {
  id: string
  name: string
  role: string
}

export default function TenantSwitcher() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      fetchTenants()
    }
  }, [session])

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants')
      if (response.ok) {
        const data = await response.json()
        setTenants(data.tenants || [])
      }
    } catch (error) {
      console.error('Error fetching tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSwitch = async (tenantId: string) => {
    if (tenantId === session?.activeTenantId) return

    setSwitching(true)
    try {
      const response = await fetch('/api/tenants/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      })

      if (response.ok) {
        // Update session
        await update({ activeTenantId: tenantId })
        router.refresh()
      } else {
        console.error('Failed to switch tenant')
      }
    } catch (error) {
      console.error('Error switching tenant:', error)
    } finally {
      setSwitching(false)
    }
  }

  if (loading || !session?.activeTenantId) {
    return null
  }

  const currentTenant = tenants.find(t => t.id === session.activeTenantId)

  return (
    <div className="relative">
      <select
        value={session.activeTenantId}
        onChange={(e) => handleSwitch(e.target.value)}
        disabled={switching}
        className="pl-3 pr-10 py-2 text-sm border border-border/60 rounded-xl bg-surfaceElevated text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 appearance-none cursor-pointer transition-all hover:bg-surface font-bold uppercase tracking-widest"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23A8B3CF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
          backgroundSize: '1rem'
        }}
      >
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id} className="bg-surfaceElevated">
            {tenant.name} {tenant.role === 'owner' && '★'}
          </option>
        ))}
      </select>
    </div>
  )
}
