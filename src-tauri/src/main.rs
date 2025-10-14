// Tauri Backend for Truckore Pro
// Handles SQLite database operations

use rusqlite::{Connection, types::ValueRef};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use base64::{Engine as _, engine::general_purpose};

#[derive(Debug, Serialize, Deserialize)]
struct QueryResult {
    rows: Vec<serde_json::Value>,
}

// Helper function to convert serde_json::Value to rusqlite::types::Value
fn json_to_sql_value(json_val: &serde_json::Value) -> rusqlite::types::Value {
    match json_val {
        serde_json::Value::Null => rusqlite::types::Value::Null,
        serde_json::Value::Bool(b) => rusqlite::types::Value::Integer(*b as i64),
        serde_json::Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                rusqlite::types::Value::Integer(i)
            } else if let Some(f) = n.as_f64() {
                rusqlite::types::Value::Real(f)
            } else {
                rusqlite::types::Value::Null
            }
        }
        serde_json::Value::String(s) => rusqlite::types::Value::Text(s.clone()),
        serde_json::Value::Array(_) | serde_json::Value::Object(_) => {
            rusqlite::types::Value::Text(json_val.to_string())
        }
    }
}

// Helper function to convert rusqlite::types::ValueRef to serde_json::Value
fn sql_to_json_value(sql_val: ValueRef) -> serde_json::Value {
    match sql_val {
        ValueRef::Null => serde_json::Value::Null,
        ValueRef::Integer(i) => serde_json::json!(i),
        ValueRef::Real(f) => serde_json::json!(f),
        ValueRef::Text(s) => {
            // Try to parse as JSON first (for arrays/objects stored as text)
            let text = String::from_utf8_lossy(s);
            serde_json::from_str(&text).unwrap_or(serde_json::Value::String(text.to_string()))
        }
        ValueRef::Blob(b) => {
            // Convert blob to base64 string
            serde_json::Value::String(general_purpose::STANDARD.encode(b))
        }
    }
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
    
    // Convert JSON params to SQL values
    let sql_params: Vec<rusqlite::types::Value> = params.iter()
        .map(|p| json_to_sql_value(p))
        .collect();
    
    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    
    let column_count = stmt.column_count();
    let column_names: Vec<String> = (0..column_count)
        .map(|i| stmt.column_name(i).unwrap_or("").to_string())
        .collect();
    
    let rows = stmt
        .query_map(rusqlite::params_from_iter(sql_params.iter()), |row| {
            let mut map = serde_json::Map::new();
            for (i, name) in column_names.iter().enumerate() {
                let value_ref = row.get_ref(i).unwrap();
                let json_value = sql_to_json_value(value_ref);
                map.insert(name.clone(), json_value);
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
    
    // Convert JSON params to SQL values
    let sql_params: Vec<rusqlite::types::Value> = params.iter()
        .map(|p| json_to_sql_value(p))
        .collect();
    
    conn.execute(&query, rusqlite::params_from_iter(sql_params.iter()))
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
