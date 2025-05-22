import { v4 as uuidv4 } from 'uuid';
import type { IUtilService } from './util.type';

export class UtilService implements IUtilService {
  generateThumbnailId(): string {
    return uuidv4();
  }
}
