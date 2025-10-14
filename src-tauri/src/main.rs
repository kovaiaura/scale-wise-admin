// Tauri Backend for Truckore Pro
// Handles SQLite database operations

use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize)]
struct QueryResult {
    rows: Vec<serde_json::Value>,
}

// Database path helper
fn get_db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;
    
    fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;
    
    Ok(app_data_dir.join("data").join("truckore_data.db"))
}

// Initialize database with schema
#[tauri::command]
fn init_database(app: AppHandle) -> Result<(), String> {
    let db_path = get_db_path(&app)?;
    
    // Create data directory if it doesn't exist
    if let Some(parent) = db_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    // Execute schema
    let schema = include_str!("../../src/services/database/schema.sql");
    conn.execute_batch(schema).map_err(|e| e.to_string())?;
    
    Ok(())
}

// Execute a SELECT query
#[tauri::command]
fn execute_query(
    app: AppHandle,
    query: String,
    params: Vec<serde_json::Value>,
) -> Result<Vec<serde_json::Value>, String> {
    let db_path = get_db_path(&app)?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    
    let column_count = stmt.column_count();
    let column_names: Vec<String> = (0..column_count)
        .map(|i| stmt.column_name(i).unwrap_or("").to_string())
        .collect();
    
    let rows = stmt
        .query_map(rusqlite::params_from_iter(params.iter()), |row| {
            let mut map = serde_json::Map::new();
            for (i, name) in column_names.iter().enumerate() {
                let value: Result<serde_json::Value, _> = row.get(i);
                if let Ok(v) = value {
                    map.insert(name.clone(), v);
                }
            }
            Ok(serde_json::Value::Object(map))
        })
        .map_err(|e| e.to_string())?;
    
    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    
    Ok(result)
}

// Execute a non-query (INSERT, UPDATE, DELETE)
#[tauri::command]
fn execute_non_query(
    app: AppHandle,
    query: String,
    params: Vec<serde_json::Value>,
) -> Result<(), String> {
    let db_path = get_db_path(&app)?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    conn.execute(&query, rusqlite::params_from_iter(params.iter()))
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            init_database,
            execute_query,
            execute_non_query
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
