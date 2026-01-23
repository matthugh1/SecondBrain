'use client'

import { useState, useEffect, useCallback } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { Category } from '@/types'

interface GraphNode {
  id: string
  type: Category
  name: string
}

interface GraphEdge {
  id: string
  source: string
  target: string
  type: string
  strength: number
}

interface RelationshipGraphProps {
  itemTypes?: Category[]
  minStrength?: number
}

export default function RelationshipGraph({ itemTypes, minStrength = 0.3 }: RelationshipGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (itemTypes && itemTypes.length > 0) {
          params.append('types', itemTypes.join(','))
        }
        params.append('minStrength', minStrength.toString())

        const response = await fetch(`/api/relationships/graph?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch graph data')
        }

        const data = await response.json()

        // Convert to React Flow format
        const flowNodes: Node[] = data.nodes.map((node: GraphNode, index: number) => {
          const colors: Record<Category, string> = {
            people: '#3b82f6',
            projects: '#10b981',
            ideas: '#f59e0b',
            admin: '#ef4444',
          }

          return {
            id: node.id,
            type: 'default',
            data: {
              label: (
                <div className="text-center">
                  <div className="font-semibold text-sm">{node.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{node.type}</div>
                </div>
              ),
            },
            position: {
              x: Math.random() * 800,
              y: Math.random() * 600,
            },
            style: {
              background: colors[node.type] || '#6b7280',
              color: '#fff',
              border: '2px solid #1f2937',
              borderRadius: '8px',
              padding: '10px',
              minWidth: '120px',
            },
          }
        })

        const flowEdges: Edge[] = data.edges.map((edge: GraphEdge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep',
          animated: edge.strength > 0.7,
          style: {
            strokeWidth: Math.max(2, edge.strength * 5),
            stroke: edge.strength > 0.7 ? '#3b82f6' : '#6b7280',
          },
          label: edge.type.replace('_', ' '),
          labelStyle: { fontSize: '10px', fill: '#6b7280' },
        }))

        setNodes(flowNodes)
        setEdges(flowEdges)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching graph:', err)
        setError('Failed to load relationship graph')
        setLoading(false)
      }
    }

    fetchGraphData()
  }, [itemTypes, minStrength, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="text-gray-500">Loading relationship graph...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="text-gray-500">No relationships found</div>
      </div>
    )
  }

  return (
    <div className="w-full h-96 border border-gray-200 dark:border-gray-700 rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  )
}
