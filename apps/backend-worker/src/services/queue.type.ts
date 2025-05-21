export interface IQueueService {
  start(): Promise<void>;
  stop(): Promise<void>;
}