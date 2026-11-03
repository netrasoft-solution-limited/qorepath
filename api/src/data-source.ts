// Entry point for the TypeORM CLI (npm run migration:*). Reads the same .env as the app.
import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { databaseOptions } from './database.config';

export default new DataSource(databaseOptions(process.env));
