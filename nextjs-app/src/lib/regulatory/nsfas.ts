import { checkNsfasDistanceEligibility, checkNsfasCapCompliance } from '@/lib/utils';

export function isNsfasDistanceEligible(distanceKm: number): boolean {
  return checkNsfasDistanceEligibility(distanceKm);
}

export function isNsfasWithinCap(annualAmount: number): boolean {
  return checkNsfasCapCompliance(annualAmount);
}

