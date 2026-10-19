import { Category } from '../types';

export interface GeorefConfig {
  mapSizePx: [number, number];
  anchorPx: [number, number];
  anchorLatLng: [number, number];
  metersPerPixel: number;
  northUp: boolean;
  approximate: boolean;
}

export interface SeedLargeSite {
  id: string;
  name: string;
  area: string;
  px: [number, number];
  accepts: Category[];
  acceptsVerified: boolean;
  address: string;
  phone: string | null;
  hours: string | null;
}

export type RawBinPair = [string, number, number, string];

export const GEOREF_CONFIG: GeorefConfig = {
  mapSizePx: [1462, 1079],
  anchorPx: [710, 705],
  anchorLatLng: [29.865, 77.897],
  metersPerPixel: 1.0,
  northUp: true,
  approximate: true,
};

export const SEED_LARGE_SITES: SeedLargeSite[] = [
  {
    id: 'L1',
    name: 'Large collection site L1',
    area: 'North campus, near Cautley Bhawan and the Air Ground',
    px: [595, 300],
    accepts: ['wet', 'dry'],
    acceptsVerified: false,
    address: 'Indian Institute of Technology Roorkee, Roorkee, Uttarakhand 247667',
    phone: null,
    hours: null,
  },
  {
    id: 'L2',
    name: 'Large collection site L2',
    area: 'Vikas Nagar staff residences, north of the Teacher Hostel',
    px: [1000, 340],
    accepts: ['wet', 'dry'],
    acceptsVerified: false,
    address: 'Indian Institute of Technology Roorkee, Roorkee, Uttarakhand 247667',
    phone: null,
    hours: null,
  },
  {
    id: 'L3',
    name: 'Large collection site L3',
    area: 'East-central campus, north-east of the Administration Building',
    px: [860, 615],
    accepts: ['wet', 'dry'],
    acceptsVerified: false,
    address: 'Indian Institute of Technology Roorkee, Roorkee, Uttarakhand 247667',
    phone: null,
    hours: null,
  },
  {
    id: 'L4',
    name: 'Large collection site L4',
    area: 'Ravindra Bhawan (hostel), west-central campus',
    px: [420, 690],
    accepts: ['wet', 'dry'],
    acceptsVerified: false,
    address: 'Indian Institute of Technology Roorkee, Roorkee, Uttarakhand 247667',
    phone: null,
    hours: null,
  },
  {
    id: 'L5',
    name: 'Large collection site L5',
    area: 'South-central academic zone, west of A. N. Khosla Bhawan',
    px: [700, 935],
    accepts: ['wet', 'dry'],
    acceptsVerified: false,
    address: 'Indian Institute of Technology Roorkee, Roorkee, Uttarakhand 247667',
    phone: null,
    hours: null,
  },
  {
    id: 'L6',
    name: 'Large collection site L6',
    area: 'Govind Bhawan (hostel), south-west campus',
    px: [560, 945],
    accepts: ['wet', 'dry'],
    acceptsVerified: false,
    address: 'Indian Institute of Technology Roorkee, Roorkee, Uttarakhand 247667',
    phone: null,
    hours: null,
  },
];

export const SEED_BIN_PAIRS: RawBinPair[] = [
  ['B01', 560, 95, 'L1'],
  ['B02', 470, 235, 'L1'],
  ['B03', 520, 160, 'L1'],
  ['B04', 600, 215, 'L1'],
  ['B05', 640, 175, 'L1'],
  ['B06', 700, 235, 'L1'],
  ['B07', 880, 170, 'L2'],
  ['B08', 960, 215, 'L2'],
  ['B09', 1060, 235, 'L2'],
  ['B10', 430, 275, 'L1'],
  ['B11', 540, 350, 'L1'],
  ['B12', 640, 330, 'L1'],
  ['B13', 700, 300, 'L1'],
  ['B14', 790, 250, 'L1'],
  ['B15', 880, 330, 'L2'],
  ['B16', 940, 330, 'L2'],
  ['B17', 1010, 265, 'L2'],
  ['B18', 1070, 300, 'L2'],
  ['B19', 215, 440, 'L4'],
  ['B20', 330, 440, 'L4'],
  ['B21', 560, 420, 'L1'],
  ['B22', 760, 420, 'L1'],
  ['B23', 1000, 390, 'L2'],
  ['B24', 1090, 420, 'L2'],
  ['B25', 235, 570, 'L4'],
  ['B26', 380, 520, 'L4'],
  ['B27', 500, 500, 'L4'],
  ['B28', 640, 575, 'L3'],
  ['B29', 880, 560, 'L3'],
  ['B30', 1040, 500, 'L2'],
  ['B31', 1165, 485, 'L2'],
  ['B32', 1205, 565, 'L2'],
  ['B33', 150, 640, 'L4'],
  ['B34', 255, 675, 'L4'],
  ['B35', 440, 600, 'L4'],
  ['B36', 520, 690, 'L4'],
  ['B37', 780, 610, 'L3'],
  ['B38', 790, 690, 'L3'],
  ['B39', 1000, 610, 'L3'],
  ['B40', 300, 740, 'L4'],
  ['B41', 330, 810, 'L4'],
  ['B42', 400, 830, 'L4'],
  ['B43', 620, 770, 'L5'],
  ['B44', 730, 800, 'L5'],
  ['B45', 850, 790, 'L3'],
  ['B46', 870, 740, 'L3'],
  ['B47', 1010, 720, 'L3'],
  ['B48', 1070, 800, 'L3'],
  ['B49', 320, 930, 'L6'],
  ['B50', 430, 900, 'L6'],
  ['B51', 570, 860, 'L6'],
  ['B52', 640, 880, 'L5'],
  ['B53', 780, 880, 'L5'],
  ['B54', 900, 930, 'L5'],
  ['B55', 960, 860, 'L3'],
  ['B56', 980, 950, 'L5'],
  ['B57', 60, 990, 'L4'],
  ['B58', 450, 985, 'L6'],
  ['B59', 500, 1010, 'L6'],
  ['B60', 610, 1010, 'L6'],
  ['B61', 700, 980, 'L5'],
  ['B62', 760, 1015, 'L5'],
  ['B63', 860, 1000, 'L5'],
];
