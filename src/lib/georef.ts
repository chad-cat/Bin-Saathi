import { GEOREF_CONFIG, SEED_BIN_PAIRS, SEED_LARGE_SITES } from '../data/seedSites';
import { Site } from '../types';

export interface LinearModel {
  slopeLat: number;
  interceptLat: number;
  slopeLng: number;
  interceptLng: number;
}

// Earth constants
const METERS_PER_DEG_LAT = 111139.0;
const RAD_PER_DEG = Math.PI / 180.0;

function getMetersPerDegLng(lat: number): number {
  return METERS_PER_DEG_LAT * Math.cos(lat * RAD_PER_DEG);
}

// Default initial model from Appendix C
function getDefaultModel(): LinearModel {
  const [anchorX, anchorY] = GEOREF_CONFIG.anchorPx;
  const [anchorLat, anchorLng] = GEOREF_CONFIG.anchorLatLng;
  const metersPerPx = GEOREF_CONFIG.metersPerPixel; // 1.0

  const metersPerDegLng = getMetersPerDegLng(anchorLat);

  // y increases downwards (South), so latitude decreases with y
  const slopeLat = -metersPerPx / METERS_PER_DEG_LAT;
  const interceptLat = anchorLat - slopeLat * anchorY;

  // x increases rightwards (East), so longitude increases with x
  const slopeLng = metersPerPx / metersPerDegLng;
  const interceptLng = anchorLng - slopeLng * anchorX;

  return { slopeLat, interceptLat, slopeLng, interceptLng };
}

let activeModel: LinearModel = getDefaultModel();

/**
 * Least-squares 1D linear regression: y = m*x + c
 */
function fitLine(xVals: number[], yVals: number[]): { slope: number; intercept: number } {
  const n = xVals.length;
  if (n < 2) {
    return { slope: 0, intercept: yVals[0] || 0 };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += xVals[i];
    sumY += yVals[i];
    sumXY += xVals[i] * yVals[i];
    sumXX += xVals[i] * xVals[i];
  }

  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-9) {
    return { slope: 0, intercept: sumY / n };
  }

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/**
 * Refits the linear transformation if 2 or more sites have been GPS-pinned.
 */
export function refitGeoref(pinnedSites: { px: [number, number]; latlng: [number, number] }[]): LinearModel {
  if (pinnedSites.length < 2) {
    activeModel = getDefaultModel();
    return activeModel;
  }

  const py = pinnedSites.map((s) => s.px[1]);
  const lat = pinnedSites.map((s) => s.latlng[0]);

  const px = pinnedSites.map((s) => s.px[0]);
  const lng = pinnedSites.map((s) => s.latlng[1]);

  const latFit = fitLine(py, lat);
  const lngFit = fitLine(px, lng);

  activeModel = {
    slopeLat: latFit.slope,
    interceptLat: latFit.intercept,
    slopeLng: lngFit.slope,
    interceptLng: lngFit.intercept,
  };

  return activeModel;
}

export function pxToLatLng(px: [number, number], model: LinearModel = activeModel): [number, number] {
  const [x, y] = px;
  const lat = model.slopeLat * y + model.interceptLat;
  const lng = model.slopeLng * x + model.interceptLng;
  return [Number(lat.toFixed(6)), Number(lng.toFixed(6))];
}

export function latLngToPx(latlng: [number, number], model: LinearModel = activeModel): [number, number] {
  const [lat, lng] = latlng;
  const y = (lat - model.interceptLat) / model.slopeLat;
  const x = (lng - model.interceptLng) / model.slopeLng;
  return [Math.round(x), Math.round(y)];
}

/**
 * Checks if a pixel point is well outside the campus map bounds (more than padding=150 px).
 */
export function isOutsideMap(px: [number, number], padding: number = 150): boolean {
  const [width, height] = GEOREF_CONFIG.mapSizePx;
  const [x, y] = px;
  return x < -padding || x > width + padding || y < -padding || y > height + padding;
}

/**
 * Haversine formula for distance between two points on Earth in meters.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * RAD_PER_DEG;
  const dLon = (lon2 - lon1) * RAD_PER_DEG;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * RAD_PER_DEG) *
      Math.cos(lat2 * RAD_PER_DEG) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Approximate walking time: 80 meters per minute.
 */
export function calculateWalkingMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / 80));
}

/**
 * Builds the initial seed dataset of 63 bin pairs + 6 large collection sites.
 */
export function buildSeedSites(): Site[] {
  const now = Date.now();
  const sites: Site[] = [];

  // 1. Large sites L1 to L6
  for (const ls of SEED_LARGE_SITES) {
    const latlng = pxToLatLng(ls.px);
    sites.push({
      id: ls.id,
      kind: 'large_site',
      name: ls.name,
      area: ls.area,
      px: ls.px,
      latlng,
      latlngSource: 'georef',
      accepts: [...ls.accepts],
      acceptsVerified: ls.acceptsVerified,
      address: ls.address,
      phone: ls.phone,
      hours: ls.hours,
      addedBy: 'seed',
      confirmations: 1,
      reports: 0,
      createdAt: now,
    });
  }

  // 2. Bin pairs B01 to B63
  for (const [id, x, y, nearestL] of SEED_BIN_PAIRS) {
    const px: [number, number] = [x, y];
    const latlng = pxToLatLng(px);
    sites.push({
      id,
      kind: 'bin_pair',
      name: `Bin pair ${id}`,
      area: `Campus zone near ${nearestL}`,
      px,
      latlng,
      latlngSource: 'georef',
      accepts: ['wet', 'dry'],
      acceptsVerified: true,
      notes: 'Paired dry (blue) and wet (green) bins',
      addedBy: 'seed',
      confirmations: 1,
      reports: 0,
      createdAt: now,
    });
  }

  return sites;
}
