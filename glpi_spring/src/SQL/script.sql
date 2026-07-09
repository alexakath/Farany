CREATE TABLE IF NOT EXISTS periodes_feriees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    date_debut DATE,
    date_fin   DATE,
    CHECK (date_fin >= date_debut)
);
CREATE INDEX IF NOT EXISTS idx_periodes_dates 
ON periodes_feriees(date_debut, date_fin);


CREATE TABLE IF NOT EXISTS user_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  
    user_id INTEGER NOT NULL,           
    filename TEXT NOT NULL              
);


