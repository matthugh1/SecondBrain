'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CalendarEvent {
  id: number
  subject: string
  startTime: string
  endTime: string
  location?: string | null
  attendees?: string | null
  description?: string | null
  isAllDay: boolean
}

export default function CalendarPage() {

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(new Date())

  useEffect(() => {
    fetchCalendarEvents()
  }, [currentWeek])

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true)
      const startOfWeek = getStartOfWeek(currentWeek)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 7)

      console.log('Fetching calendar events:', {
        startOfWeek: startOfWeek.toISOString(),
        endOfWeek: endOfWeek.toISOString(),
      })

      const response = await fetch(
        `/api/calendar?startDate=${startOfWeek.toISOString()}&endDate=${endOfWeek.toISOString()}`,
        {
          credentials: 'include',
        }
      )


      if (response.ok) {
        const data = await response.json()
        console.log('Calendar events received:', data)
        setEvents(data.events || [])
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch calendar events:', response.status, errorText)
      }
    } catch (error) {
      console.error('Failed to fetch calendar events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
    return new Date(d.setDate(diff))
  }

  const getWeekDays = (): Date[] => {
    const start = getStartOfWeek(currentWeek)
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      days.push(day)
    }
    return days
  }

  const getHours = (): number[] => {
    return Array.from({ length: 24 }, (_, i) => i)
  }

  const getEventsForDayAndHour = (day: Date, hour: number): CalendarEvent[] => {
    return events.filter((event) => {
      const start = new Date(event.startTime)
      const end = new Date(event.endTime)
      const dayStart = new Date(day)
      dayStart.setHours(hour, 0, 0, 0)
      const dayEnd = new Date(day)
      dayEnd.setHours(hour + 1, 0, 0, 0)

      // Check if event overlaps with this hour
      return (
        start.toDateString() === day.toDateString() &&
        start.getHours() <= hour &&
        end.getHours() >= hour
      )
    })
  }

  const getEventPosition = (event: CalendarEvent, day: Date): { top: number; height: number } => {
    const start = new Date(event.startTime)
    const end = new Date(event.endTime)

    // Calculate minutes from midnight
    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const endMinutes = end.getHours() * 60 + end.getMinutes()
    const duration = endMinutes - startMinutes

    // Each hour is 64px (h-16 = 4rem = 64px)
    const top = (startMinutes / 60) * 64
    const height = Math.max((duration / 60) * 64, 48) // Minimum height of 48px

    return { top, height }
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  const goToToday = () => {
    setCurrentWeek(new Date())
  }

  const weekDays = getWeekDays()
  const hours = getHours()


  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <nav className="mb-4">
              <Link
                href="/"
                className="text-xs font-bold text-primary uppercase tracking-widest hover:text-primary/80 transition-colors flex items-center gap-1 group"
              >
                <svg className="w-3 h-3 transform group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
                Dashboard
              </Link>
            </nav>
            <h1 className="text-4xl font-black text-textPrimary tracking-tight">Calendar</h1>
            <p className="text-sm text-textMuted mt-1 font-medium">
              Week of {weekDays[0].toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
              })}{' '}
              - {weekDays[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex bg-surface border border-border/60 rounded-xl p-1 shadow-lg">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-surfaceElevated rounded-lg transition-colors text-textMuted hover:text-textPrimary"
              title="Previous Week"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-1 text-xs font-bold text-textPrimary uppercase tracking-widest hover:bg-surfaceElevated rounded-lg transition-colors border-x border-border mx-1"
            >
              Today
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-surfaceElevated rounded-lg transition-colors text-textMuted hover:text-textPrimary"
              title="Next Week"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-textMuted font-medium italic">Loading calendar sync...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-surfaceElevated rounded-2xl border border-border/60 p-20 text-center shadow-xl">
            <div className="w-16 h-16 bg-surfaceElevated border border-border rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-textPrimary mb-2">Clear Schedule</h2>
            <p className="text-textMuted max-w-sm mx-auto">No events found for this week. Enjoy the quiet time or capture some new tasks!</p>
          </div>
        ) : (
          <div className="bg-surfaceElevated rounded-2xl border border-border/60 overflow-hidden shadow-2xl">
            {/* Calendar Grid */}
            <div className="overflow-x-auto">
              <div className="inline-flex min-w-full">
                {/* Time column */}
                <div className="flex-shrink-0 w-20 border-r border-border bg-surface/50">
                  <div className="h-14 border-b border-border"></div>
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="h-16 border-b border-border/30 flex items-start justify-end pr-3 pt-1"
                    >
                      <span className="text-[10px] font-bold text-textMuted uppercase tracking-tighter">
                        {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDays.map((day, dayIndex) => {
                  const dayStart = new Date(day)
                  dayStart.setHours(0, 0, 0, 0)
                  const dayEnd = new Date(day)
                  dayEnd.setHours(23, 59, 59, 999)

                  const dayEvents = events.filter((event) => {
                    const eventStart = new Date(event.startTime)
                    const eventEnd = new Date(event.endTime)
                    return (
                      (eventStart >= dayStart && eventStart <= dayEnd) ||
                      (eventEnd >= dayStart && eventEnd <= dayEnd) ||
                      (eventStart <= dayStart && eventEnd >= dayEnd)
                    )
                  })

                  return (
                    <div
                      key={dayIndex}
                      className={`flex-1 min-w-[200px] border-r border-border ${isToday(day) ? 'bg-primary/[0.03]' : ''
                        }`}
                    >
                      {/* Day header */}
                      <div
                        className={`h-14 border-b border-border p-3 ${isToday(day)
                          ? 'bg-primary/10'
                          : 'bg-surfaceElevated/50'
                          }`}
                      >
                        <div className={`text-xs font-bold uppercase tracking-widest ${isToday(day) ? 'text-primary' : 'text-textMuted'}`}>
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={`text-lg font-black tracking-tighter ${isToday(day) ? 'text-textPrimary' : 'text-textMuted'}`}>
                          {day.getDate()}
                        </div>
                      </div>

                      {/* Hour slots */}
                      <div className="relative">
                        {hours.map((hour) => (
                          <div
                            key={hour}
                            className="h-16 border-b border-border/20 group hover:bg-surfaceElevated/30 transition-colors"
                          ></div>
                        ))}

                        {/* Events overlay */}
                        {dayEvents.map((event) => {
                          const eventStart = new Date(event.startTime)
                          const eventEnd = new Date(event.endTime)

                          if (eventStart.toDateString() !== day.toDateString()) {
                            return null
                          }

                          const { top, height } = getEventPosition(event, day)
                          const now = new Date()
                          const isCurrentMeeting = now >= eventStart && now <= eventEnd

                          return (
                            <div
                              key={event.id}
                              className={`absolute left-1 right-1 rounded-xl px-3 py-2 text-xs shadow-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:z-20 group ${isCurrentMeeting
                                ? 'bg-primary text-textPrimary shadow-primary/30 border border-primary/50'
                                : 'bg-surfaceElevated text-textPrimary border border-border hover:border-secondary/50'
                                }`}
                              style={{
                                top: `${top}px`,
                                height: `${Math.max(height, 50)}px`,
                                zIndex: isCurrentMeeting ? 10 : 1,
                              }}
                            >
                              <div className="font-bold truncate group-hover:whitespace-normal transition-all">{event.subject}</div>
                              <div className={`text-[10px] mt-0.5 font-bold uppercase tracking-tight ${isCurrentMeeting ? 'text-textPrimary/80' : 'text-textMuted'}`}>
                                {new Date(event.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                {' - '}
                                {new Date(event.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                              </div>
                              {(event.location || event.description) && (
                                <div className={`text-[10px] mt-1.5 truncate border-t pt-1.5 ${isCurrentMeeting ? 'border-textPrimary/20 text-textPrimary/70' : 'border-border text-textMuted'}`}>
                                  {event.location ? `📍 ${event.location}` : event.description}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Legend / Info */}
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_8px_rgba(109,95,248,0.5)]"></div>
              <span className="text-[10px] font-bold text-textMuted uppercase tracking-widest">Active Meeting</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-surfaceElevated border border-border rounded-full"></div>
              <span className="text-[10px] font-bold text-textMuted uppercase tracking-widest">Scheduled</span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-textMuted uppercase tracking-widest italic">
            Synced with your primary brain calendar
          </p>
        </div>
      </div>
    </div>
  )
}
