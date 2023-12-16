import { knexController } from '../../database/database';
import {
  Compressor,
  CreateCompressorRequest,
} from '../../types/compressor.types';

export const createCompressor = async (
  payload: CreateCompressorRequest
): Promise<Compressor> => {
  const sql =
    'INSERT INTO compressor (name, description, is_enabled) VALUES (?,?, ?) RETURNING id';
  const params = [payload.body.name, payload.body.description, true];

  // Type source: Akzu404
  const res = await knexController.raw<Array<Array<{ id: string }>>>(
    sql,
    params
  );
  const [[{ id: insertedCompressorId }]] = res;

  return {
    ...payload.body,
    id: insertedCompressorId,
    isEnabled: true,
  };
};

export const getCompressors = async (): Promise<Compressor[]> => {
  return knexController('compressor').select(
    'id',
    'name',
    'description',
    'is_enabled AS isEnabled'
  );
};
