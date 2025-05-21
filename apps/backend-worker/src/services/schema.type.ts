export interface ISchemaService {
  runMigrations(): Promise<void>;
}