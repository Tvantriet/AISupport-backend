/**
 * Interface for database operations
 * Provides a common contract for different database implementations
 */
export interface DatabaseProvider {
  /**
   * Connect to the database
   * @returns Promise resolving when connection is established
   */
  connect(): Promise<void>;
  
  /**
   * Execute a query with parameters
   * @param query SQL query with placeholders
   * @param params Parameters to substitute in the query
   * @returns Promise resolving to query results
   */
  query<T = any>(query: string, params?: any[]): Promise<T[]>;
  
  /**
   * Execute a single-row query
   * @param query SQL query with placeholders
   * @param params Parameters to substitute in the query
   * @returns Promise resolving to a single result or null
   */
  queryOne<T = any>(query: string, params?: any[]): Promise<T | null>;
  
  /**
   * Insert a record and return the created entity
   * @param table Table name
   * @param data Object containing column:value pairs to insert
   * @returns Promise resolving to the created record
   */
  insert<T = any>(table: string, data: Record<string, any>): Promise<T>;
  
  /**
   * Update records matching a condition
   * @param table Table name
   * @param data Object containing column:value pairs to update
   * @param condition WHERE condition (column = value)
   * @param params Additional parameters for the condition
   * @returns Promise resolving to number of updated rows
   */
  update(
    table: string, 
    data: Record<string, any>, 
    condition: string, 
    params?: any[]
  ): Promise<number>;
  
  /**
   * Delete records matching a condition
   * @param table Table name
   * @param condition WHERE condition
   * @param params Parameters for the condition
   * @returns Promise resolving to number of deleted rows
   */
  delete(table: string, condition: string, params?: any[]): Promise<number>;
  
  /**
   * Close the database connection
   */
  disconnect(): Promise<void>;
} 