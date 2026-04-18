import sqlite3

def migrate():
    try:
        db = sqlite3.connect('database/spendly.db')
        
        # Check if columns already exist
        cursor = db.execute("PRAGMA table_info(expenses)")
        cols = [col[1] for col in cursor.fetchall()]
        
        if 'payment_method' not in cols:
            db.execute("ALTER TABLE expenses ADD COLUMN payment_method TEXT DEFAULT 'Cash'")
            print("Added payment_method to expenses")
            
        cursor = db.execute("PRAGMA table_info(recurring_expenses)")
        cols = [col[1] for col in cursor.fetchall()]
        
        if 'payment_method' not in cols:
            db.execute("ALTER TABLE recurring_expenses ADD COLUMN payment_method TEXT DEFAULT 'Cash'")
            print("Added payment_method to recurring_expenses")
            
        # Create goals table if not exists (init_db already does this but safety first)
        db.execute("""
            CREATE TABLE IF NOT EXISTS goals (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id        INTEGER NOT NULL,
                name           TEXT    NOT NULL,
                target_amount  REAL    NOT NULL,
                current_saved   REAL    DEFAULT 0,
                deadline       TEXT,
                created_at     TEXT    DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        db.commit()
        db.close()
        print("Migration completed successfully.")
    except Exception as e:
        print(f"Migration error: {e}")

if __name__ == "__main__":
    migrate()
