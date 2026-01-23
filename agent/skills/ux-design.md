# UX Design Skill

This skill documents the design system and UI principles for the Second Brain application, ensuring consistency and a premium AI-inspired aesthetic.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React (or SVG equivalents)
- **Typography**: Inter / System Sans

## Color Palette
The application uses a deep, modern AI-inspired color system:

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#0B1020` | Main application background |
| `surface` | `#111A2E` | Table headers, inactive filter buttons, sidebar backgrounds |
| `surfaceElevated`| `#16213A` | Cards, containers, table bodies, active inputs, elevated surfaces |
| `primary` | `#6D5EF8` | Primary actions, branding, active filter buttons, indigo glow |
| `secondary` | `#2ED3B7` | Success states, links, custom template badges, mint accents |
| `highlight` | `#FFB020` | Warnings, priority tags, amber accents |
| `error` | `#FF4D6D` | Destructive actions, error states, delete buttons |
| `success` | `#3EE08F` | Success messages, filed status badges |
| `warning` | `#FFB020` | Needs review status badges |
| `info` | `#5BC0FF` | Info states, weekly review badges |
| `textPrimary` | `#EAF0FF` | Primary headings and text |
| `textMuted` | `#A8B3CF` | Secondary text, labels, dates, inactive states |
| `border` | `#243252` | Borders and dividers (use `/60` opacity for better visibility) |

## Design Principles

### 1. Modern AI Aesthetic
- **Glassmorphism**: Use `backdrop-blur-md` and semi-transparent backgrounds (`bg-surface/90`) for seamless blending (e.g., GlobalStatsBar).
- **Subtle Glows**: Apply `shadow-lg shadow-primary/20` or `shadow-[0_0_15px_rgba(109,95,248,0.1)]` to key interactive elements.
- **Deep Navy Base**: Avoid pure black (#000); use `#0B1020` for better depth.
- **Border Visibility**: Use `border-border/60` for better contrast instead of full opacity borders.

### 2. Interactive States
- **Hover Transitions**: Always use `transition-all duration-300` for smooth state changes.
- **Elevation**: Use `hover:-translate-y-1` and `hover:bg-surfaceElevated` to indicate interactivity.
- **Shadow Progressions**: Intensify glows on hover (e.g., `hover:shadow-primary/30`).
- **Action Buttons**: Always visible (never use `opacity-0 group-hover:opacity-100`). Use `opacity-100` with subtle hover effects.
- **Filter Buttons**: Active state uses `bg-primary text-textPrimary shadow-lg shadow-primary/20`. Inactive uses `bg-surface text-textMuted border border-border/60`.

### 3. Typography
- **Hierarchy**: Use `font-black` and `tracking-tight` for main headers (e.g., `text-4xl font-black text-textPrimary tracking-tight`). Use `font-bold` and `uppercase tracking-widest` for small labels (e.g., `text-[10px] font-bold text-textMuted uppercase tracking-widest`).
- **Subtitles**: Use `text-textMuted font-medium italic` for descriptive subtitles.
- **Readability**: Ensure high contrast with `textPrimary` on `surfaceElevated` backgrounds.

### 4. Components

#### GlobalStatsBar
- **Background**: `bg-surface/90 backdrop-blur-md` for seamless blending with the UI
- **Border**: `border-b border-border/60` for subtle separation
- **Text**: Use `text-textPrimary` and `text-textMuted` for hierarchy

#### StatsCards
- **Background**: `bg-surfaceElevated` (not `bg-surface`) with `border border-border/60`
- **Hover**: `hover:bg-surface hover:-translate-y-1 hover:shadow-primary/20`
- **Title**: `text-xs font-bold text-textMuted uppercase tracking-widest`
- **Value**: `text-3xl font-black text-textPrimary tracking-tight`

#### Tables (DatabaseTable, InboxLogView)
- **Container**: `bg-surfaceElevated border border-border/60 rounded-xl shadow-xl`
- **Header**: `bg-surface border-b border-border/60` (not `bg-surfaceElevated`)
- **Header Text**: `text-[10px] font-bold text-textMuted uppercase tracking-widest`
- **Body**: `bg-surfaceElevated` (or `bg-surface` for alternating contrast)
- **Rows**: `hover:bg-surfaceElevated/80` (stronger hover for better visibility)
- **Borders**: `divide-border/60` for row separators
- **Action Buttons**: Always visible with `opacity-100`, use `p-2` with hover states like `hover:bg-secondary/20`

#### Filter Buttons
- **Active**: `bg-primary text-textPrimary shadow-lg shadow-primary/20`
- **Inactive**: `bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60`
- **Rounded**: Use `rounded-lg` (not just `rounded`)

#### Status Badges
- **Filed**: `bg-success/20 text-success border border-success/30`
- **Needs Review**: `bg-warning/20 text-warning border border-warning/30`
- **Category Tags**: `bg-primary/20 text-primary border border-primary/30`

#### Chat Interface
- **Container**: `bg-surface border border-border rounded-xl shadow-2xl`
- **User Messages**: `bg-primary text-textPrimary` with `shadow-[0_4px_15px_rgba(109,95,248,0.3)]`
- **Bot Messages**: `bg-surfaceElevated text-textPrimary border border-border`

#### Error/Success Messages
- **Error**: `border border-error/30 bg-error/10 text-error`
- **Success**: `border border-success/30 bg-success/10 text-success`
- **Rounded**: Use `rounded-lg` for consistency

#### Modals
- **Backdrop**: `bg-black/60 backdrop-blur-sm`
- **Container**: `bg-surfaceElevated border border-border/60 rounded-xl shadow-2xl`
- **Inputs**: `bg-surface border border-border/60 text-textPrimary placeholder-textMuted focus:ring-2 focus:ring-primary/50`

## Accessibility
- Maintain WCAG contrast ratios (minimum 4.5:1 for body text).
- Use semantic HTML elements.
- Ensure focus states are visible (`focus:ring-2 focus:ring-primary/50`).
- Action buttons should always be visible (not hidden until hover).
- Use sufficient border opacity (`border-border/60`) for better visibility.

## Common Patterns

### Page Layout
```tsx
<div className="min-h-screen bg-background">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <h1 className="text-4xl font-black text-textPrimary tracking-tight">
      Page Title
    </h1>
    <p className="mt-2 text-textMuted font-medium italic">
      Subtitle description
    </p>
    {/* Content */}
  </div>
</div>
```

### Card Container
```tsx
<div className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-6">
  {/* Card content */}
</div>
```

### Filter Button Group
```tsx
<div className="flex flex-wrap items-center gap-2">
  <button className={`px-4 py-2 rounded-lg font-medium transition-all ${
    isActive 
      ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
      : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
  }`}>
    Filter Label
  </button>
</div>
```