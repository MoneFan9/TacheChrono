import initSqlJs from 'sql.js';
import { Task, Priority, Category, SubTask, User } from '../types';

let db: any = null;
const DB_STORAGE_KEY = 'sqlite_db_binary';

// Configuration pour charger le fichier WASM depuis un CDN fiable avec la version correspondante exacte (1.12.0)
const SQL_WASM_URL = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.wasm';

export const initDB = async () => {
  if (db) return db;

  try {
    const response = await fetch(SQL_WASM_URL);
    if (!response.ok) {
        throw new Error(`Impossible de charger le fichier WASM: ${response.statusText}`);
    }
    const wasmBinary = await response.arrayBuffer();

    const SQL = await initSqlJs({
      wasmBinary,
    });

    const savedDb = localStorage.getItem(DB_STORAGE_KEY);
    
    if (savedDb) {
      const binaryArray = new Uint8Array(JSON.parse(savedDb));
      db = new SQL.Database(binaryArray);
    } else {
      db = new SQL.Database();
      saveDB();
    }

    // Table Tâches
    const createTasksTable = `
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        isCompleted INTEGER DEFAULT 0,
        priority TEXT NOT NULL,
        category TEXT NOT NULL,
        subtasks TEXT
      );
    `;
    db.run(createTasksTable);

    // Table Utilisateurs (Auth locale)
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        avatarUrl TEXT
      );
    `;
    db.run(createUsersTable);
    
    return db;
  } catch (err) {
    console.error("Erreur lors de l'initialisation de SQLite:", err);
    throw err;
  }
};

const saveDB = () => {
  if (!db) return;
  try {
    const data = db.export();
    const array = Array.from(data);
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(array));
  } catch (e) {
    console.error("Erreur sauvegarde DB (quota localStorage ?)", e);
  }
};

/* --- GESTION DES TÂCHES --- */

export const getTasks = async (): Promise<Task[]> => {
  if (!db) await initDB();
  
  try {
    const result = db.exec("SELECT * FROM tasks");
    if (result.length === 0) return [];

    const columns = result[0].columns;
    const values = result[0].values;

    return values.map((row: any[]) => {
      const task: any = {};
      columns.forEach((col: string, index: number) => {
        task[col] = row[index];
      });

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        date: new Date(task.date),
        isCompleted: task.isCompleted === 1,
        priority: task.priority as Priority,
        category: task.category as Category,
        subtasks: task.subtasks ? JSON.parse(task.subtasks) : []
      };
    });
  } catch (error) {
    console.error("Erreur lecture tâches:", error);
    return [];
  }
};

export const saveTask = async (task: Task) => {
  if (!db) await initDB();

  const stmtExists = db.prepare("SELECT id FROM tasks WHERE id=:id");
  stmtExists.bind({':id': task.id});
  const isExisting = stmtExists.step();
  stmtExists.free();
  
  const formattedTask = {
    ':id': task.id,
    ':title': task.title,
    ':description': task.description || '',
    ':date': task.date.toISOString(),
    ':isCompleted': task.isCompleted ? 1 : 0,
    ':priority': task.priority,
    ':category': task.category,
    ':subtasks': JSON.stringify(task.subtasks)
  };

  if (isExisting) {
    const stmt = db.prepare(`
      UPDATE tasks SET 
        title = :title,
        description = :description,
        date = :date,
        isCompleted = :isCompleted,
        priority = :priority,
        category = :category,
        subtasks = :subtasks
      WHERE id = :id
    `);
    stmt.run(formattedTask);
    stmt.free();
  } else {
    const stmt = db.prepare(`
      INSERT INTO tasks (id, title, description, date, isCompleted, priority, category, subtasks)
      VALUES (:id, :title, :description, :date, :isCompleted, :priority, :category, :subtasks)
    `);
    stmt.run(formattedTask);
    stmt.free();
  }
  
  saveDB();
};

export const deleteTask = async (id: string) => {
  if (!db) await initDB();
  
  try {
    const stmt = db.prepare("DELETE FROM tasks WHERE id=:id");
    stmt.run({':id': id});
    stmt.free();
    saveDB();
  } catch (e) {
    console.error("Erreur DB delete:", e);
    throw e;
  }
};

export const deleteTasks = async (ids: string[]) => {
  if (!db) await initDB();
  if (ids.length === 0) return;
  
  try {
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare("DELETE FROM tasks WHERE id=:id");
    
    for (const id of ids) {
      stmt.run({':id': id});
    }
    
    stmt.free();
    db.run("COMMIT");
    saveDB();
  } catch (error) {
    console.error("Erreur suppression multiple:", error);
    try { db.run("ROLLBACK"); } catch(e) {}
    throw error;
  }
};

export const toggleTaskComplete = async (id: string, currentStatus: boolean) => {
  if (!db) await initDB();
  const newStatus = currentStatus ? 0 : 1;
  const stmt = db.prepare("UPDATE tasks SET isCompleted = :status WHERE id = :id");
  stmt.run({':status': newStatus, ':id': id});
  stmt.free();
  saveDB();
};

/* --- AUTHENTIFICATION (LOCALE) --- */

export const registerUser = async (name: string, email: string, password: string): Promise<User> => {
    if (!db) await initDB();

    try {
        const id = crypto.randomUUID();
        // Note: Dans une vraie app, le mot de passe devrait être hashé (ex: bcrypt).
        // Ici, stockage en clair car client-side only demo.
        const stmt = db.prepare("INSERT INTO users (id, name, email, password) VALUES (:id, :name, :email, :password)");
        stmt.run({
            ':id': id,
            ':name': name,
            ':email': email.toLowerCase(),
            ':password': password
        });
        stmt.free();
        saveDB();

        return { id, name, email, avatarUrl: undefined };
    } catch (e: any) {
        if (e.message && e.message.includes('UNIQUE constraint failed')) {
            throw new Error("Cet email est déjà utilisé.");
        }
        throw e;
    }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
    if (!db) await initDB();

    const stmt = db.prepare("SELECT id, name, email, avatarUrl FROM users WHERE email=:email AND password=:password");
    stmt.bind({
        ':email': email.toLowerCase(),
        ':password': password
    });
    
    if (stmt.step()) {
        const result = stmt.getAsObject();
        stmt.free();
        return {
            id: result.id,
            name: result.name,
            email: result.email,
            avatarUrl: result.avatarUrl || undefined
        };
    } else {
        stmt.free();
        throw new Error("Email ou mot de passe incorrect.");
    }
};
