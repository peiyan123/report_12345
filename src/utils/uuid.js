import { v4 as uuidv4 } from 'uuid';
// Generate a UUID
export const getUuid = () => {
  return uuidv4();
}