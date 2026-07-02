import { SetMetadata } from '@nestjs/common';

export const OWNERSHIP_KEY = 'resource_ownership';

export interface OwnershipMetadata {
  resource: 'interview' | 'media';
  paramName: string;
}

export const Ownership = (
  resource: OwnershipMetadata['resource'],
  paramName = 'id',
) => SetMetadata(OWNERSHIP_KEY, { resource, paramName });
