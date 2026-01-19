// Legacy SQLite schema - no longer used, app now uses Prisma with PostgreSQL
// This file is kept for migration purposes but should not be used in production

export function createDatabase(): never {
  throw new Error('createDatabase() is no longer supported. Please use Prisma migrations instead.')
  
  /* Legacy code removed - using Prisma now
  import Database from 'better-sqlite3'
  import path from 'path'
  import fs from 'fs'

  const dbPath = process.env.DATABASE_PATH || './data/secondbrain.db'
  const DEFAULT_TENANT_ID = 'default'

  // Ensure data directory exists
  const dbDir = path.dirname(dbPath)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  const db = (() => {
  const db = new Database(dbPath)
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON')
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
      name TEXT NOT NULL,
      context TEXT,
      follow_ups TEXT,
      last_touched TEXT,
      tags TEXT,
      archived INTEGER DEFAULT 0,
      archived_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
      name TEXT NOT NULL,
      status TEXT DEFAULT 'Active',
      next_action TEXT,
      notes TEXT,
      archived INTEGER DEFAULT 0,
      archived_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
      name TEXT NOT NULL,
      one_liner TEXT,
      notes TEXT,
      last_touched TEXT,
      tags TEXT,
      archived INTEGER DEFAULT 0,
      archived_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
      name TEXT NOT NULL,
      due_date TEXT,
      status TEXT DEFAULT 'Todo',
      notes TEXT,
      archived INTEGER DEFAULT 0,
      archived_at TEXT,
      created TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inbox_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
      original_text TEXT NOT NULL,
      filed_to TEXT NOT NULL,
      destination_name TEXT,
      destination_url TEXT,
      confidence REAL,
      status TEXT DEFAULT 'Filed',
      created TEXT DEFAULT (datetime('now')),
      notion_record_id TEXT
    );

    CREATE TABLE IF NOT EXISTS digests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      created TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rule_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
      confidence_threshold REAL DEFAULT 0.7,
      default_project_status TEXT DEFAULT 'Active',
      default_admin_status TEXT DEFAULT 'Todo',
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE (tenant_id)
    );

    CREATE TABLE IF NOT EXISTS rule_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
      category_key TEXT NOT NULL,
      label TEXT NOT NULL,
      description TEXT,
      enabled INTEGER DEFAULT 1,
      field_schema TEXT,
      display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE (tenant_id, category_key)
    );

    CREATE TABLE IF NOT EXISTS rule_prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
      name TEXT NOT NULL,
      template TEXT NOT NULL,
      active INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE (tenant_id, name)
    );

    CREATE TABLE IF NOT EXISTS rule_routing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
      category_key TEXT NOT NULL,
      destination_table TEXT NOT NULL,
      field_mapping TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE (tenant_id, category_key)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
      item_type TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      mime_type TEXT,
      size INTEGER,
      uploaded_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
      item_type TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      field_key TEXT,
      content TEXT NOT NULL,
      author TEXT DEFAULT 'User',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS action_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
      action_type TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id INTEGER,
      old_data TEXT,
      new_data TEXT,
      timestamp TEXT DEFAULT (datetime('now')),
      undone INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS classification_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
      message_text TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT,
      prompt TEXT,
      response_text TEXT,
      parsed_result TEXT,
      status TEXT NOT NULL,
      error_message TEXT,
      created TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE (tenant_id, name)
    );

    CREATE TABLE IF NOT EXISTS item_tags (
      tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
      item_type TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (tenant_id, item_type, item_id, tag_id),
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
      tenant_id UNINDEXED,
      item_type,
      item_id UNINDEXED,
      title,
      content,
      tags,
      updated_at UNINDEXED
    );

    CREATE TABLE IF NOT EXISTS saved_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
      name TEXT NOT NULL,
      query TEXT,
      filters TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

  `)
  
  const ensureDefaultTenant = () => {
    db.prepare(`
      INSERT OR IGNORE INTO tenants (id, name)
      VALUES (?, ?)
    `).run(DEFAULT_TENANT_ID, 'Default')
  }

  const hasColumn = (tableName: string, columnName: string) => {
    const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[]
    return tableInfo.some(col => col.name === columnName)
  }

  const addTenantColumn = (tableName: string) => {
    if (!hasColumn(tableName, 'tenant_id')) {
      db.prepare(`ALTER TABLE ${tableName} ADD COLUMN tenant_id TEXT DEFAULT '${DEFAULT_TENANT_ID}'`).run()
      db.prepare(`UPDATE ${tableName} SET tenant_id = '${DEFAULT_TENANT_ID}' WHERE tenant_id IS NULL`).run()
    }
  }

  const rebuildRuleSettings = () => {
    if (hasColumn('rule_settings', 'tenant_id')) return
    db.exec(`
      CREATE TABLE IF NOT EXISTS rule_settings_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
        confidence_threshold REAL DEFAULT 0.7,
        default_project_status TEXT DEFAULT 'Active',
        default_admin_status TEXT DEFAULT 'Todo',
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE (tenant_id)
      );
      INSERT INTO rule_settings_new (id, tenant_id, confidence_threshold, default_project_status, default_admin_status, updated_at)
      SELECT id, '${DEFAULT_TENANT_ID}', confidence_threshold, default_project_status, default_admin_status, updated_at
      FROM rule_settings;
      DROP TABLE rule_settings;
      ALTER TABLE rule_settings_new RENAME TO rule_settings;
    `)
  }

  const rebuildRuleCategories = () => {
    if (hasColumn('rule_categories', 'tenant_id')) return
    db.exec(`
      CREATE TABLE IF NOT EXISTS rule_categories_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
        category_key TEXT NOT NULL,
        label TEXT NOT NULL,
        description TEXT,
        enabled INTEGER DEFAULT 1,
        field_schema TEXT,
        display_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE (tenant_id, category_key)
      );
      INSERT INTO rule_categories_new (id, tenant_id, category_key, label, description, enabled, field_schema, display_order, created_at, updated_at)
      SELECT id, '${DEFAULT_TENANT_ID}', category_key, label, description, enabled, field_schema, display_order, created_at, updated_at
      FROM rule_categories;
      DROP TABLE rule_categories;
      ALTER TABLE rule_categories_new RENAME TO rule_categories;
    `)
  }

  const rebuildRulePrompts = () => {
    if (hasColumn('rule_prompts', 'tenant_id')) return
    db.exec(`
      CREATE TABLE IF NOT EXISTS rule_prompts_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
        name TEXT NOT NULL,
        template TEXT NOT NULL,
        active INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE (tenant_id, name)
      );
      INSERT INTO rule_prompts_new (id, tenant_id, name, template, active, created_at, updated_at)
      SELECT id, '${DEFAULT_TENANT_ID}', name, template, active, created_at, updated_at
      FROM rule_prompts;
      DROP TABLE rule_prompts;
      ALTER TABLE rule_prompts_new RENAME TO rule_prompts;
    `)
  }

  const rebuildRuleRouting = () => {
    if (hasColumn('rule_routing', 'tenant_id')) return
    db.exec(`
      CREATE TABLE IF NOT EXISTS rule_routing_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
        category_key TEXT NOT NULL,
        destination_table TEXT NOT NULL,
        field_mapping TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE (tenant_id, category_key)
      );
      INSERT INTO rule_routing_new (id, tenant_id, category_key, destination_table, field_mapping, created_at, updated_at)
      SELECT id, '${DEFAULT_TENANT_ID}', category_key, destination_table, field_mapping, created_at, updated_at
      FROM rule_routing;
      DROP TABLE rule_routing;
      ALTER TABLE rule_routing_new RENAME TO rule_routing;
    `)
  }

  const rebuildTags = () => {
    if (hasColumn('tags', 'tenant_id')) return
    db.exec(`
      CREATE TABLE IF NOT EXISTS tags_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
        name TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE (tenant_id, name)
      );
      INSERT INTO tags_new (id, tenant_id, name, created_at)
      SELECT id, '${DEFAULT_TENANT_ID}', name, created_at
      FROM tags;
      DROP TABLE tags;
      ALTER TABLE tags_new RENAME TO tags;
    `)
  }

  const rebuildItemTags = () => {
    if (hasColumn('item_tags', 'tenant_id')) return
    db.exec(`
      CREATE TABLE IF NOT EXISTS item_tags_new (
        tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}',
        item_type TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (tenant_id, item_type, item_id, tag_id),
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );
      INSERT INTO item_tags_new (tenant_id, item_type, item_id, tag_id)
      SELECT '${DEFAULT_TENANT_ID}', item_type, item_id, tag_id
      FROM item_tags;
      DROP TABLE item_tags;
      ALTER TABLE item_tags_new RENAME TO item_tags;
    `)
  }

  const rebuildSearchIndex = () => {
    if (hasColumn('search_index', 'tenant_id')) return
    db.exec(`
      DROP TABLE IF EXISTS search_index;
      CREATE VIRTUAL TABLE search_index USING fts5(
        tenant_id UNINDEXED,
        item_type,
        item_id UNINDEXED,
        title,
        content,
        tags,
        updated_at UNINDEXED
      );
    `)
  }

  // Migrate existing tables to add archived columns if they don't exist
  const addArchivedColumn = (tableName: string) => {
    try {
      const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[]
      const hasArchived = tableInfo.some(col => col.name === 'archived')
      const hasArchivedAt = tableInfo.some(col => col.name === 'archived_at')
      
      if (!hasArchived) {
        db.prepare(`ALTER TABLE ${tableName} ADD COLUMN archived INTEGER DEFAULT 0`).run()
      }
      if (!hasArchivedAt) {
        db.prepare(`ALTER TABLE ${tableName} ADD COLUMN archived_at TEXT`).run()
      }
    } catch (error) {
      // Column might already exist or table doesn't exist yet - ignore
      console.warn(`Could not add archived columns to ${tableName}:`, error)
    }
  }
  
  addArchivedColumn('people')
  addArchivedColumn('projects')
  addArchivedColumn('ideas')
  addArchivedColumn('admin')

  ensureDefaultTenant()
  rebuildRuleSettings()
  rebuildRuleCategories()
  rebuildRulePrompts()
  rebuildRuleRouting()
  rebuildTags()
  rebuildItemTags()
  rebuildSearchIndex()

  addTenantColumn('people')
  addTenantColumn('projects')
  addTenantColumn('ideas')
  addTenantColumn('admin')
  addTenantColumn('inbox_log')
  addTenantColumn('digests')
  addTenantColumn('attachments')
  addTenantColumn('comments')
  addTenantColumn('action_history')
  addTenantColumn('classification_audit')
  addTenantColumn('saved_searches')
  
  // Create indexes on archived columns (after ensuring columns exist)
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_people_archived ON people(tenant_id, archived);
      CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(tenant_id, archived);
      CREATE INDEX IF NOT EXISTS idx_ideas_archived ON ideas(tenant_id, archived);
      CREATE INDEX IF NOT EXISTS idx_admin_archived ON admin(tenant_id, archived);
    `)
  } catch (error) {
    console.warn('Could not create archived indexes:', error)
  }

  // Create multi-tenant indexes after tenant columns exist
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_inbox_log_created ON inbox_log(tenant_id, created);
      CREATE INDEX IF NOT EXISTS idx_inbox_log_status ON inbox_log(tenant_id, status);
      CREATE INDEX IF NOT EXISTS idx_inbox_log_filed_to ON inbox_log(tenant_id, filed_to);
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(tenant_id, status);
      CREATE INDEX IF NOT EXISTS idx_people_name ON people(tenant_id, name);
      CREATE INDEX IF NOT EXISTS idx_digests_type ON digests(tenant_id, type);
      CREATE INDEX IF NOT EXISTS idx_digests_created ON digests(tenant_id, created);
      CREATE INDEX IF NOT EXISTS idx_rule_categories_key ON rule_categories(tenant_id, category_key);
      CREATE INDEX IF NOT EXISTS idx_rule_categories_enabled ON rule_categories(tenant_id, enabled);
      CREATE INDEX IF NOT EXISTS idx_rule_prompts_active ON rule_prompts(tenant_id, active);
      CREATE INDEX IF NOT EXISTS idx_rule_routing_category ON rule_routing(tenant_id, category_key);
      CREATE INDEX IF NOT EXISTS idx_attachments_item ON attachments(tenant_id, item_type, item_id);
      CREATE INDEX IF NOT EXISTS idx_comments_item ON comments(tenant_id, item_type, item_id);
      CREATE INDEX IF NOT EXISTS idx_comments_field ON comments(tenant_id, field_key);
      CREATE INDEX IF NOT EXISTS idx_action_history_item ON action_history(tenant_id, item_type, item_id);
      CREATE INDEX IF NOT EXISTS idx_action_history_timestamp ON action_history(tenant_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_action_history_undone ON action_history(tenant_id, undone);
      CREATE INDEX IF NOT EXISTS idx_classification_audit_created ON classification_audit(tenant_id, created);
      CREATE INDEX IF NOT EXISTS idx_classification_audit_status ON classification_audit(tenant_id, status);
      CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(tenant_id, name);
      CREATE INDEX IF NOT EXISTS idx_item_tags_item ON item_tags(tenant_id, item_type, item_id);
      CREATE INDEX IF NOT EXISTS idx_item_tags_tag ON item_tags(tenant_id, tag_id);
      CREATE INDEX IF NOT EXISTS idx_saved_searches_name ON saved_searches(tenant_id, name);
    `)
  } catch (error) {
    console.warn('Could not create tenant indexes:', error)
  }
  
  // Initialize default rule settings if not exists
  const settingsCheck = db.prepare('SELECT COUNT(*) as count FROM rule_settings WHERE tenant_id = ?')
    .get(DEFAULT_TENANT_ID) as { count: number }
  if (settingsCheck.count === 0) {
    db.prepare(`
      INSERT INTO rule_settings (tenant_id, confidence_threshold, default_project_status, default_admin_status)
      VALUES (?, 0.7, 'Active', 'Todo')
    `).run(DEFAULT_TENANT_ID)
  }

  // Initialize default categories if not exists
  const categoriesCheck = db.prepare('SELECT COUNT(*) as count FROM rule_categories WHERE tenant_id = ?')
    .get(DEFAULT_TENANT_ID) as { count: number }
  if (categoriesCheck.count === 0) {
    const insertCategory = db.prepare(`
      INSERT INTO rule_categories (tenant_id, category_key, label, description, enabled, field_schema, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    insertCategory.run(DEFAULT_TENANT_ID, 'people', 'People', 'Information about a person, relationship update, something someone said', 1, JSON.stringify({
      required: ['name'],
      fields: { name: 'string', context: 'string', follow_ups: 'string' }
    }), 1)
    
    insertCategory.run(DEFAULT_TENANT_ID, 'projects', 'Projects', 'A project, task with multiple steps, ongoing work', 1, JSON.stringify({
      required: ['name'],
      fields: { name: 'string', status: 'string', next_action: 'string', notes: 'string' }
    }), 2)
    
    insertCategory.run(DEFAULT_TENANT_ID, 'ideas', 'Ideas', 'A thought, insight, concept, something to explore later', 1, JSON.stringify({
      required: ['name'],
      fields: { name: 'string', one_liner: 'string', notes: 'string' }
    }), 3)
    
    insertCategory.run(DEFAULT_TENANT_ID, 'admin', 'Admin', 'A simple errand, one-off task, something with a due date', 1, JSON.stringify({
      required: ['name'],
      fields: { name: 'string', due_date: 'string', notes: 'string' }
    }), 4)
  }

  // Initialize default classification prompt if not exists
  const promptsCheck = db.prepare('SELECT COUNT(*) as count FROM rule_prompts WHERE tenant_id = ?')
    .get(DEFAULT_TENANT_ID) as { count: number }
  if (promptsCheck.count === 0) {
    const defaultPrompt = `You are a classification system for a personal knowledge management system. Your job is to analyze the user's captured thought and return structured JSON.

INPUT:
{messageText}

INSTRUCTIONS:
1. Determine which category this belongs to:
- "people" - information about a person, relationship update, something someone said
- "projects" - a project, task with multiple steps, ongoing work
- "ideas" - a thought, insight, concept, something to explore later
- "admin" - a simple errand, one-off task, something with a due date

2. Extract relevant fields based on the category:
- For "people": name (required), context (how you know them), follow_ups (things to remember)
- For "projects": name (required), status (Active/Waiting/Blocked/Someday/Done), next_action, notes
- For "ideas": name (required), one_liner (core insight), notes
- For "admin": name (required), due_date (if mentioned), notes

3. Provide a confidence score between 0 and 1 (1 = very confident, 0 = uncertain)

4. Return ONLY valid JSON in this exact format:
{
  "category": "people|projects|ideas|admin",
  "fields": {
    "name": "...",
    ...other fields based on category
  },
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of classification"
}

RULES:
- Be concise but accurate
- If uncertain, set confidence < {confidenceThreshold}
- Extract dates in ISO format (YYYY-MM-DD) if mentioned
- If a person's name is mentioned, use that as the name field
- For projects, default status to "{defaultProjectStatus}" unless clearly stated otherwise
- For admin tasks, extract due dates if mentioned (e.g., "by Friday" = calculate date)`
    
    db.prepare(`
      INSERT INTO rule_prompts (tenant_id, name, template, active)
      VALUES (?, 'classification', ?, 1)
    `).run(DEFAULT_TENANT_ID, defaultPrompt)
  }

  // Initialize default routing rules if not exists
  const routingCheck = db.prepare('SELECT COUNT(*) as count FROM rule_routing WHERE tenant_id = ?')
    .get(DEFAULT_TENANT_ID) as { count: number }
  if (routingCheck.count === 0) {
    const insertRouting = db.prepare(`
      INSERT INTO rule_routing (tenant_id, category_key, destination_table, field_mapping)
      VALUES (?, ?, ?, ?)
    `)
    
    insertRouting.run(DEFAULT_TENANT_ID, 'people', 'people', JSON.stringify({ name: 'name', context: 'context', follow_ups: 'follow_ups' }))
    insertRouting.run(DEFAULT_TENANT_ID, 'projects', 'projects', JSON.stringify({ name: 'name', status: 'status', next_action: 'next_action', notes: 'notes' }))
    insertRouting.run(DEFAULT_TENANT_ID, 'ideas', 'ideas', JSON.stringify({ name: 'name', one_liner: 'one_liner', notes: 'notes' }))
    insertRouting.run(DEFAULT_TENANT_ID, 'admin', 'admin', JSON.stringify({ name: 'name', due_date: 'due_date', notes: 'notes' }))
  }

  // Migrate existing tags from comma-separated strings to normalized tables
  try {
    const migrateTags = (tableName: string, itemType: string) => {
      const items = db.prepare(`SELECT id, tags, tenant_id FROM ${tableName} WHERE tags IS NOT NULL AND tags != ''`).all() as any[]
      const getOrCreateTag = db.prepare('INSERT OR IGNORE INTO tags (tenant_id, name) VALUES (?, ?)')
      const getTagId = db.prepare('SELECT id FROM tags WHERE tenant_id = ? AND name = ?')
      const insertItemTag = db.prepare('INSERT OR IGNORE INTO item_tags (tenant_id, item_type, item_id, tag_id) VALUES (?, ?, ?, ?)')
      
      for (const item of items) {
        const tagNames = item.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
        for (const tagName of tagNames) {
          const tenantId = item.tenant_id || DEFAULT_TENANT_ID
          getOrCreateTag.run(tenantId, tagName)
          const tagRow = getTagId.get(tenantId, tagName) as any
          if (tagRow) {
            insertItemTag.run(tenantId, itemType, item.id, tagRow.id)
          }
        }
      }
    }
    
    migrateTags('people', 'people')
    migrateTags('projects', 'projects')
    migrateTags('ideas', 'ideas')
    migrateTags('admin', 'admin')
  } catch (error) {
    console.warn('Could not migrate tags:', error)
  }

  // Populate search index with existing data
  try {
    const syncSearchIndex = () => {
      // Clear existing index
      db.prepare('DELETE FROM search_index').run()
      
      // Helper to get tags for an item
      const getItemTags = db.prepare(`
        SELECT GROUP_CONCAT(t.name, ' ') as tags
        FROM item_tags it
        JOIN tags t ON it.tag_id = t.id
        WHERE it.tenant_id = ? AND it.item_type = ? AND it.item_id = ?
      `)
      
      // Sync people
      const people = db.prepare('SELECT id, tenant_id, name, context, follow_ups, updated_at, created_at FROM people').all() as any[]
      const insertSearch = db.prepare(`
        INSERT INTO search_index (tenant_id, item_type, item_id, title, content, tags, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      
      for (const p of people) {
        const tenantId = p.tenant_id || DEFAULT_TENANT_ID
        const tags = (getItemTags.get(tenantId, 'people', p.id) as any)?.tags || ''
        const content = [p.context, p.follow_ups].filter(Boolean).join(' ')
        insertSearch.run(tenantId, 'people', p.id, p.name || '', content, tags, p.updated_at || p.created_at || '')
      }
      
      // Sync projects
      const projects = db.prepare('SELECT id, tenant_id, name, status, next_action, notes, updated_at, created_at FROM projects').all() as any[]
      for (const p of projects) {
        const tenantId = p.tenant_id || DEFAULT_TENANT_ID
        const tags = (getItemTags.get(tenantId, 'projects', p.id) as any)?.tags || ''
        const content = [p.status, p.next_action, p.notes].filter(Boolean).join(' ')
        insertSearch.run(tenantId, 'projects', p.id, p.name || '', content, tags, p.updated_at || p.created_at || '')
      }
      
      // Sync ideas
      const ideas = db.prepare('SELECT id, tenant_id, name, one_liner, notes, updated_at, created_at FROM ideas').all() as any[]
      for (const i of ideas) {
        const tenantId = i.tenant_id || DEFAULT_TENANT_ID
        const tags = (getItemTags.get(tenantId, 'ideas', i.id) as any)?.tags || ''
        const content = [i.one_liner, i.notes].filter(Boolean).join(' ')
        insertSearch.run(tenantId, 'ideas', i.id, i.name || '', content, tags, i.updated_at || i.created_at || '')
      }
      
      // Sync admin
      const admin = db.prepare('SELECT id, tenant_id, name, due_date, status, notes, updated_at, created FROM admin').all() as any[]
      for (const a of admin) {
        const tenantId = a.tenant_id || DEFAULT_TENANT_ID
        const tags = (getItemTags.get(tenantId, 'admin', a.id) as any)?.tags || ''
        const content = [a.due_date, a.status, a.notes].filter(Boolean).join(' ')
        insertSearch.run(tenantId, 'admin', a.id, a.name || '', content, tags, a.updated_at || a.created || '')
      }
    }
    
    syncSearchIndex()
  } catch (error) {
    console.warn('Could not populate search index:', error)
  }
  
    return db
  })()
  
  return db
  */
}
