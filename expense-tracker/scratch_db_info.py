import sqlite3

def display_schema():
    try:
        db = sqlite3.connect('database/spendly.db')
        cursor = db.execute("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        tables = cursor.fetchall()
        
        print(f"{'TABLE NAME':<20} | {'COLUMNS'}")
        print("-" * 60)
        
        for name, sql in tables:
            # Simple extraction of columns from SQL string
            try:
                cols_part = sql.split('(', 1)[1].rsplit(')', 1)[0]
                cols = [c.strip().split(' ')[0] for c in cols_part.split(',')]
                print(f"{name:<20} | {', '.join(cols)}")
            except:
                print(f"{name:<20} | (Schema hidden or complex)")
        
        print("\n" + "="*40 + "\nFull SQL Schemas:\n" + "="*40)
        for name, sql in tables:
            print(f"\n-- {name} --\n{sql}\n")
            
        db.close()
    except Exception as e:
        print(f"Error reading database: {e}")

if __name__ == "__main__":
    display_schema()
