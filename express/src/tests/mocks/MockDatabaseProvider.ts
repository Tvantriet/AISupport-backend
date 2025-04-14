import { DatabaseProvider } from "../../app/interfaces/DatabaseProvider.js";

/**
 * Mock implementation of DatabaseProvider for testing
 */
export default class MockDatabaseProvider implements DatabaseProvider {
  private data: Map<string, any[]> = new Map();
  private connected: boolean = false;
  
  /**
   * Connect to the mock database
   */
  public async connect(): Promise<void> {
    this.connected = true;
    return Promise.resolve();
  }
  
  /**
   * Execute a mock query
   */
  public async query<T = any>(query: string, params: any[] = []): Promise<T[]> {
    // Simple mock implementation that returns data from the in-memory store
    // This is a very basic implementation and doesn't actually parse SQL
    
    // Extract table name from query (very simplified)
    const tableMatch = query.match(/FROM\s+(\w+)/i);
    const table = tableMatch ? tableMatch[1] : null;
    
    if (!table || !this.data.has(table)) {
      return [] as T[];
    }
    
    return this.data.get(table) as T[];
  }
  
  /**
   * Execute a mock single-row query
   */
  public async queryOne<T = any>(query: string, params: any[] = []): Promise<T | null> {
    const results = await this.query<T>(query, params);
    return results.length > 0 ? results[0] : null;
  }
  
  /**
   * Perform a mock insert operation
   */
  public async insert<T = any>(table: string, data: Record<string, any>): Promise<T> {
    if (!this.data.has(table)) {
      this.data.set(table, []);
    }
    
    // Add auto-incrementing id if not provided
    const newData = { 
      id: data.id || Date.now(), 
      ...data,
      created_at: data.created_at || new Date().toISOString()
    };
    
    this.data.get(table)!.push(newData);
    return newData as T;
  }
  
  /**
   * Perform a mock update operation
   */
  public async update(
    table: string, 
    data: Record<string, any>, 
    condition: string, 
    params: any[] = []
  ): Promise<number> {
    if (!this.data.has(table)) {
      return 0;
    }
    
    // This is a very simplified implementation
    // In a real mock, you would parse the condition and apply it
    
    // For simplicity, we'll just update all records in the table
    const tableData = this.data.get(table)!;
    tableData.forEach(record => {
      Object.keys(data).forEach(key => {
        record[key] = data[key];
      });
    });
    
    return tableData.length;
  }
  
  /**
   * Perform a mock delete operation
   */
  public async delete(table: string, condition: string, params: any[] = []): Promise<number> {
    if (!this.data.has(table)) {
      return 0;
    }
    
    // Very simplified - would normally parse condition
    const beforeCount = this.data.get(table)!.length;
    this.data.set(table, []);
    
    return beforeCount;
  }
  
  /**
   * Disconnect from the mock database
   */
  public async disconnect(): Promise<void> {
    this.connected = false;
    this.data.clear();
    return Promise.resolve();
  }
} 