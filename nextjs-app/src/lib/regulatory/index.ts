import type { SphereType } from '@prisma/client';
import { isNsfasDistanceEligible, isNsfasWithinCap } from './nsfas';
import { validateTgcsaCompliance } from './tgcsa';

export type RegulatoryCheckContext = {
  sphereType: SphereType;
  annualAmount?: number;
  distanceKm?: number;
  payload?: unknown;
};

export function validateRegulatoryCompliance(ctx: RegulatoryCheckContext): boolean {
  switch (ctx.sphereType) {
    case 'STUDENT_ACCOMMODATION': {
      const distanceOk = ctx.distanceKm == null || isNsfasDistanceEligible(ctx.distanceKm);
      const capOk = ctx.annualAmount == null || isNsfasWithinCap(ctx.annualAmount);
      return distanceOk && capOk;
    }
    case 'HOTEL':
    case 'GUEST_HOUSE':
      return validateTgcsaCompliance(ctx.payload);
    default:
      return true;
  }
}

