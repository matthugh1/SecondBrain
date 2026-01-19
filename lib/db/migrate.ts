#!/usr/bin/env tsx
import { createDatabase } from './schema'

console.log('Initializing database...')
const db = createDatabase()
console.log('Database initialized successfully!')
db.close()
