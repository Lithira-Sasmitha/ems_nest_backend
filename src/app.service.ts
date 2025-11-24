import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  
  async checkDbConnection() {
    try {
      await this.dataSource.query('SELECT 1'); 
      return {
        status: 'connected',
        message: 'MySQL Database is working!',
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: error?.message ?? 'Unknown database error',
      };
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
}
