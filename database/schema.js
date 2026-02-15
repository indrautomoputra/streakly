const { run, get, all } = require('./queries');

async function ensureColumns(table, columns) {
  const rows = await all(`PRAGMA table_info(${table})`);
  const existing = new Set(rows.map((row) => row.name));
  for (const column of columns) {
    if (!existing.has(column.name)) {
      await run(`ALTER TABLE ${table} ADD COLUMN ${column.name} ${column.type}`);
    }
  }
}

async function ensureStatsRow() {
  const row = await get('SELECT * FROM stats WHERE id = 1');
  if (!row) {
    await run(
      'INSERT INTO stats (id, xp, streak, level, last_activity) VALUES (1, 0, 0, 0, NULL)'
    );
  }
}

async function ensureProfileRow() {
  const row = await get('SELECT * FROM profile WHERE id = 1');
  if (!row) {
    await run(
      'INSERT INTO profile (id, name, avatar, email) VALUES (1, "Raka Pratama", NULL, NULL)'
    );
  }
}

async function ensureSettingsRow() {
  const row = await get('SELECT * FROM settings WHERE id = 1');
  if (!row) {
    await run(
      'INSERT INTO settings (id, accent, accent_secondary, bg_primary, bg_secondary, bg_elevated, text_primary, text_muted, border, glow_intensity, reminder_enabled, reminder_time, xp_per_task, level_step, zoom_level, glass_enabled) VALUES (1, "#7367f0", "#9f87ff", "#f4f5fb", "#eef0f7", "#ffffff", "#3a3541", "#6f6b7d", "#e4e6ef", 0.14, 0, "09:00", 10, 100, 100, 0)'
    );
  }
}

async function ensureSchemaVersion() {
  await run(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);
  const versionRow = await get('SELECT * FROM app_meta WHERE key = ?', ['schema_version']);
  if (!versionRow) {
    await run('INSERT INTO app_meta (key, value) VALUES (?, ?)', ['schema_version', '1']);
  }
}

async function ensureGamificationSeed() {
  const badgeCount = await get('SELECT COUNT(*) as count FROM badges');
  if (!badgeCount?.count) {
    await run(
      'INSERT INTO badges (id, name, description, icon, color) VALUES (?, ?, ?, ?, ?)',
      [1, 'Starter', 'Selesaikan task pertama', '🚀', '#6f67ff']
    );
    await run(
      'INSERT INTO badges (id, name, description, icon, color) VALUES (?, ?, ?, ?, ?)',
      [2, 'Streak 3', 'Aktif 3 hari berturut-turut', '🔥', '#ff9a62']
    );
    await run(
      'INSERT INTO badges (id, name, description, icon, color) VALUES (?, ?, ?, ?, ?)',
      [3, 'Streak 7', 'Aktif 7 hari berturut-turut', '🔥', '#ef4444']
    );
    await run(
      'INSERT INTO badges (id, name, description, icon, color) VALUES (?, ?, ?, ?, ?)',
      [4, 'Level 5', 'Capai level 5', '⭐', '#46b3c5']
    );
    await run(
      'INSERT INTO badges (id, name, description, icon, color) VALUES (?, ?, ?, ?, ?)',
      [5, 'Level 10', 'Capai level 10', '🌟', '#7c9cff']
    );
    await run(
      'INSERT INTO badges (id, name, description, icon, color) VALUES (?, ?, ?, ?, ?)',
      [6, 'Master Tantangan', 'Selesaikan 3 challenge', '🏆', '#ff7c55']
    );
  }

  const challengeCount = await get('SELECT COUNT(*) as count FROM challenges');
  if (!challengeCount?.count) {
    await run(
      'INSERT INTO challenges (id, title, description, difficulty, requirement_type, requirement_value, xp_reward, badge_id, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [1, 'Pemanasan 5 Task', 'Selesaikan 5 task pertama', 'Easy', 'tasks_completed_total', 5, 30, 1, 1]
    );
    await run(
      'INSERT INTO challenges (id, title, description, difficulty, requirement_type, requirement_value, xp_reward, badge_id, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [2, 'Konsisten 3 Hari', 'Jaga streak 3 hari', 'Easy', 'streak_days', 3, 50, 2, 1]
    );
    await run(
      'INSERT INTO challenges (id, title, description, difficulty, requirement_type, requirement_value, xp_reward, badge_id, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [3, 'Konsisten 7 Hari', 'Jaga streak 7 hari', 'Medium', 'streak_days', 7, 80, 3, 1]
    );
    await run(
      'INSERT INTO challenges (id, title, description, difficulty, requirement_type, requirement_value, xp_reward, badge_id, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [4, 'Capai Level 5', 'Naikkan level ke 5', 'Medium', 'level_reached', 5, 120, 4, 1]
    );
    await run(
      'INSERT INTO challenges (id, title, description, difficulty, requirement_type, requirement_value, xp_reward, badge_id, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [5, 'Capai Level 10', 'Naikkan level ke 10', 'Hard', 'level_reached', 10, 180, 5, 1]
    );
    await run(
      'INSERT INTO challenges (id, title, description, difficulty, requirement_type, requirement_value, xp_reward, badge_id, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [6, 'Master Tantangan', 'Selesaikan 3 challenge', 'Expert', 'challenges_completed_total', 3, 220, 6, 1]
    );
  }

  const leaderboardCount = await get('SELECT COUNT(*) as count FROM leaderboard');
  if (!leaderboardCount?.count) {
    await run(
      'INSERT INTO leaderboard (name, score, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      ['Aruna', 860]
    );
    await run(
      'INSERT INTO leaderboard (name, score, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      ['Damar', 720]
    );
    await run(
      'INSERT INTO leaderboard (name, score, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      ['Naya', 640]
    );
  }
}

async function initSchema() {
  try {
    await run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        side TEXT,
        detail TEXT,
        status TEXT,
        priority TEXT,
        category TEXT,
        deadline TEXT,
        start_date TEXT,
        description_rich TEXT,
        project_id INTEGER,
        workspace_id INTEGER,
        task_type TEXT,
        assignees TEXT,
        time_tracking_enabled INTEGER DEFAULT 0,
        estimate_value REAL,
        estimate_unit TEXT,
        is_recurring INTEGER DEFAULT 0,
        recurring_frequency TEXT,
        parent_task_id INTEGER,
        dependencies TEXT,
        related_tags TEXT,
        email_notification INTEGER DEFAULT 0,
        in_app_notification INTEGER DEFAULT 0,
        reminder TEXT,
        smtp_config TEXT,
        notification_recipients TEXT,
        attachments TEXT,
        external_links TEXT,
        checklist TEXT,
        budget REAL,
        client_id INTEGER,
        labels TEXT,
        location TEXT,
        done INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS stats (
        id INTEGER PRIMARY KEY,
        xp INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        level INTEGER DEFAULT 0,
        last_activity TEXT
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS daily_stats (
        date TEXT PRIMARY KEY,
        tasks_completed INTEGER DEFAULT 0,
        xp_earned INTEGER DEFAULT 0
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        avatar TEXT,
        email TEXT
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        accent TEXT,
        accent_secondary TEXT,
        bg_primary TEXT,
        bg_secondary TEXT,
        bg_elevated TEXT,
        text_primary TEXT,
        text_muted TEXT,
        border TEXT,
        glow_intensity REAL,
        reminder_enabled INTEGER DEFAULT 0,
        reminder_time TEXT,
        xp_per_task INTEGER DEFAULT 10,
        level_step INTEGER DEFAULT 100,
        zoom_level INTEGER DEFAULT 100,
        glass_enabled INTEGER DEFAULT 0
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS badges (
        id INTEGER PRIMARY KEY,
        name TEXT,
        description TEXT,
        icon TEXT,
        color TEXT
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS user_badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        badge_id INTEGER,
        earned_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS challenges (
        id INTEGER PRIMARY KEY,
        title TEXT,
        description TEXT,
        difficulty TEXT,
        requirement_type TEXT,
        requirement_value INTEGER,
        xp_reward INTEGER,
        badge_id INTEGER,
        active INTEGER DEFAULT 1
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS user_challenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        challenge_id INTEGER,
        status TEXT,
        progress INTEGER DEFAULT 0,
        started_at TEXT DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT,
        title TEXT,
        message TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        read INTEGER DEFAULT 0
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        score INTEGER,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run('CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at)');
    await run('CREATE INDEX IF NOT EXISTS idx_tasks_done ON tasks(done)');
    await run('CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline)');
    await run('CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge_id ON user_challenges(challenge_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)');

    await ensureColumns('tasks', [
      { name: 'side', type: 'TEXT' },
      { name: 'detail', type: 'TEXT' },
      { name: 'status', type: 'TEXT' },
      { name: 'priority', type: 'TEXT' },
      { name: 'category', type: 'TEXT' },
      { name: 'deadline', type: 'TEXT' },
      { name: 'start_date', type: 'TEXT' },
      { name: 'description_rich', type: 'TEXT' },
      { name: 'project_id', type: 'INTEGER' },
      { name: 'workspace_id', type: 'INTEGER' },
      { name: 'task_type', type: 'TEXT' },
      { name: 'assignees', type: 'TEXT' },
      { name: 'time_tracking_enabled', type: 'INTEGER DEFAULT 0' },
      { name: 'estimate_value', type: 'REAL' },
      { name: 'estimate_unit', type: 'TEXT' },
      { name: 'is_recurring', type: 'INTEGER DEFAULT 0' },
      { name: 'recurring_frequency', type: 'TEXT' },
      { name: 'parent_task_id', type: 'INTEGER' },
      { name: 'dependencies', type: 'TEXT' },
      { name: 'related_tags', type: 'TEXT' },
      { name: 'email_notification', type: 'INTEGER DEFAULT 0' },
      { name: 'in_app_notification', type: 'INTEGER DEFAULT 0' },
      { name: 'reminder', type: 'TEXT' },
      { name: 'smtp_config', type: 'TEXT' },
      { name: 'notification_recipients', type: 'TEXT' },
      { name: 'attachments', type: 'TEXT' },
      { name: 'external_links', type: 'TEXT' },
      { name: 'checklist', type: 'TEXT' },
      { name: 'budget', type: 'REAL' },
      { name: 'client_id', type: 'INTEGER' },
      { name: 'labels', type: 'TEXT' },
      { name: 'location', type: 'TEXT' },
      { name: 'updated_at', type: 'TEXT' }
    ]);

    await run(
      `UPDATE tasks
       SET priority = status,
           status = 'To Do'
       WHERE priority IS NULL
         AND status IN ('Low','Medium','High','Urgent')`
    );

    const projectCount = await get('SELECT COUNT(*) as total FROM projects');
    if (!projectCount?.total) {
      await run('INSERT INTO projects (name) VALUES (?)', ['Core Platform']);
      await run('INSERT INTO projects (name) VALUES (?)', ['Mobile Refresh']);
      await run('INSERT INTO projects (name) VALUES (?)', ['Client Onboarding']);
    }

    const clientCount = await get('SELECT COUNT(*) as total FROM clients');
    if (!clientCount?.total) {
      await run('INSERT INTO clients (name) VALUES (?)', ['PT Nusantara']);
      await run('INSERT INTO clients (name) VALUES (?)', ['Global Media']);
      await run('INSERT INTO clients (name) VALUES (?)', ['Zenith Labs']);
    }

    const userCount = await get('SELECT COUNT(*) as total FROM users');
    if (!userCount?.total) {
      await run('INSERT INTO users (name, role) VALUES (?, ?)', ['Raka Pratama', 'Manager']);
      await run('INSERT INTO users (name, role) VALUES (?, ?)', ['Nadia Putri', 'Developer']);
      await run('INSERT INTO users (name, role) VALUES (?, ?)', ['Dito Arman', 'Designer']);
      await run('INSERT INTO users (name, role) VALUES (?, ?)', ['Sinta Lestari', 'QA']);
    }

    const workspaceCount = await get('SELECT COUNT(*) as total FROM workspaces');
    if (!workspaceCount?.total) {
      await run('INSERT INTO workspaces (name, parent_id) VALUES (?, ?)', ['Streakly HQ', null]);
      await run('INSERT INTO workspaces (name, parent_id) VALUES (?, ?)', ['Client Delivery', 1]);
      await run('INSERT INTO workspaces (name, parent_id) VALUES (?, ?)', ['Internal Ops', 1]);
    }

    await ensureColumns('profile', [
      { name: 'email', type: 'TEXT' }
    ]);

    await ensureColumns('settings', [
      { name: 'accent', type: 'TEXT' },
      { name: 'accent_secondary', type: 'TEXT' },
      { name: 'bg_primary', type: 'TEXT' },
      { name: 'bg_secondary', type: 'TEXT' },
      { name: 'bg_elevated', type: 'TEXT' },
      { name: 'text_primary', type: 'TEXT' },
      { name: 'text_muted', type: 'TEXT' },
      { name: 'border', type: 'TEXT' },
      { name: 'glow_intensity', type: 'REAL' },
      { name: 'reminder_enabled', type: 'INTEGER DEFAULT 0' },
      { name: 'reminder_time', type: 'TEXT' },
      { name: 'xp_per_task', type: 'INTEGER DEFAULT 10' },
      { name: 'level_step', type: 'INTEGER DEFAULT 100' },
      { name: 'zoom_level', type: 'INTEGER DEFAULT 100' },
      { name: 'glass_enabled', type: 'INTEGER DEFAULT 0' }
    ]);

    await ensureColumns('stats', [
      { name: 'xp', type: 'INTEGER DEFAULT 0' },
      { name: 'streak', type: 'INTEGER DEFAULT 0' },
      { name: 'level', type: 'INTEGER DEFAULT 0' },
      { name: 'last_activity', type: 'TEXT' }
    ]);

    await ensureColumns('daily_stats', [
      { name: 'tasks_completed', type: 'INTEGER DEFAULT 0' },
      { name: 'xp_earned', type: 'INTEGER DEFAULT 0' }
    ]);

    await ensureSchemaVersion();
    await ensureStatsRow();
    await ensureProfileRow();
    await ensureSettingsRow();
    await ensureGamificationSeed();
  } catch (err) {
    console.error(err);
  }
}

module.exports = initSchema;
