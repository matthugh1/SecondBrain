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
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name} {tenant.role === 'owner' && '(Owner)'}
          </option>
        ))}
      </select>
    </div>
  )
}
