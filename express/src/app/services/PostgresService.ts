import { DatabaseProvider } from "../interfaces/DatabaseProvider.js";
import pg from "pg";
const { Pool } = pg;

/**
 * PostgreSQL implementation of the DatabaseProvider interface
 */
export default class PostgresService implements DatabaseProvider {
  private pool: pg.Pool;
  private connected: boolean = false;
  
  /**
   * Create a new PostgreSQL service
   * @param connectionString Optional connection string (defaults to env variable)
   */
  constructor(connectionString?: string) {
    this.pool = new Pool({
      connectionString: connectionString || process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? 
        { rejectUnauthorized: false } : false
    });
  }
  
  /**
   * Connect to the database
   */
  public async connect(): Promise<void> {
    if (this.connected) return;
    
    try {
      // Test the connection by querying the server version
      const result = await this.pool.query('SELECT version()');
      console.log(`Connected to PostgreSQL: ${result.rows[0].version}`);
      this.connected = true;
    } catch (error) {
      console.error('Failed to connect to PostgreSQL:', error);
      throw new Error(`Database connection failed: ${error}`);
    }
  }
  
  /**
   * Execute a query with parameters
   * @param query SQL query with placeholders
   * @param params Parameters to substitute in the query
   * @returns Array of query results
   */
  public async query<T = any>(query: string, params: any[] = []): Promise<T[]> {
    try {
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Query error:', error);
      throw new Error(`Query failed: ${error}`);
    }
  }
  
  /**
   * Execute a single-row query
   * @param query SQL query with placeholders
   * @param params Parameters to substitute in the query
   * @returns Single result or null if not found
   */
  public async queryOne<T = any>(query: string, params: any[] = []): Promise<T | null> {
    const results = await this.query<T>(query, params);
    return results.length > 0 ? results[0] : null;
  }
  
  /**
   * Insert a record and return the created entity
   * @param table Table name
   * @param data Object containing column:value pairs to insert
   * @returns The created record
   */
  public async insert<T = any>(table: string, data: Record<string, any>): Promise<T> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.queryOne<T>(query, values);
    if (!result) {
      throw new Error('Insert operation did not return a result');
    }
    
    return result;
  }
  
  /**
   * Update records matching a condition
   * @param table Table name
   * @param data Object containing column:value pairs to update
   * @param condition WHERE condition (column = value)
   * @param params Additional parameters for the condition
   * @returns Number of updated rows
   */
  public async update(
    table: string, 
    data: Record<string, any>, 
    condition: string, 
    params: any[] = []
  ): Promise<number> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    
    // Create SET part with $n placeholders starting after the data values
    const setClause = columns
      .map((col, i) => `${col} = $${i + 1}`)
      .join(', ');
    
    // Replace condition placeholders with $n values continuing from data values
    let processedCondition = condition;
    let paramIndex = values.length;
    
    // Replace each ? in the condition with the appropriate $n
    while (processedCondition.includes('?')) {
      paramIndex++;
      processedCondition = processedCondition.replace('?', `$${paramIndex}`);
    }
    
    const query = `
      UPDATE ${table}
      SET ${setClause}
      WHERE ${processedCondition}
    `;
    
    const result = await this.pool.query(query, [...values, ...params]);
    return result.rowCount;
  }
  
  /**
   * Delete records matching a condition
   * @param table Table name
   * @param condition WHERE condition
   * @param params Parameters for the condition
   * @returns Number of deleted rows
   */
  public async delete(table: string, condition: string, params: any[] = []): Promise<number> {
    // Process condition to replace ? with $n placeholders
    let processedCondition = condition;
    let paramIndex = 0;
    
    while (processedCondition.includes('?')) {
      paramIndex++;
      processedCondition = processedCondition.replace('?', `$${paramIndex}`);
    }
    
    const query = `
      DELETE FROM ${table}
      WHERE ${processedCondition}
    `;
    
    const result = await this.pool.query(query, params);
    return result.rowCount;
  }
  
  /**
   * Close the database connection
   */
  public async disconnect(): Promise<void> {
    if (!this.connected) return;
    
    try {
      await this.pool.end();
      this.connected = false;
      console.log('Disconnected from PostgreSQL');
    } catch (error) {
      console.error('Error disconnecting from PostgreSQL:', error);
      throw error;
    }
  }
} 