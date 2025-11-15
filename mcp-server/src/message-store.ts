import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface Message {
  id: number;
  sender: string;
  senderType: 'agent' | 'human';
  content: string;
  timestamp: string;
  channel?: string;
}

export class MessageStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    // Ensure data directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT NOT NULL,
        sender_type TEXT NOT NULL CHECK(sender_type IN ('agent', 'human')),
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        channel TEXT DEFAULT 'public'
      );

      CREATE INDEX IF NOT EXISTS idx_timestamp ON messages(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_channel ON messages(channel);
    `);
  }

  addMessage(sender: string, senderType: 'agent' | 'human', content: string, channel: string = 'public'): Message {
    const stmt = this.db.prepare(`
      INSERT INTO messages (sender, sender_type, content, channel, timestamp)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);

    const result = stmt.run(sender, senderType, content, channel);
    
    return this.getMessage(result.lastInsertRowid as number);
  }

  getMessage(id: number): Message {
    const stmt = this.db.prepare('SELECT * FROM messages WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) {
      throw new Error(`Message with id ${id} not found`);
    }

    return {
      id: row.id,
      sender: row.sender,
      senderType: row.sender_type,
      content: row.content,
      timestamp: row.timestamp,
      channel: row.channel || 'public'
    };
  }

  getLatestMessages(limit: number = 50, channel: string = 'public'): Message[] {
    const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE channel = ?
      ORDER BY timestamp DESC 
      LIMIT ?
    `);

    const rows = stmt.all(channel, limit) as any[];
    
    return rows.reverse().map(row => ({
      id: row.id,
      sender: row.sender,
      senderType: row.sender_type,
      content: row.content,
      timestamp: row.timestamp,
      channel: row.channel || 'public'
    }));
  }

  getMessagesSince(timestamp: string, channel: string = 'public'): Message[] {
    const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE channel = ? AND timestamp > ?
      ORDER BY timestamp ASC
    `);

    const rows = stmt.all(channel, timestamp) as any[];
    
    return rows.map(row => ({
      id: row.id,
      sender: row.sender,
      senderType: row.sender_type,
      content: row.content,
      timestamp: row.timestamp,
      channel: row.channel || 'public'
    }));
  }

  close(): void {
    this.db.close();
  }
}

