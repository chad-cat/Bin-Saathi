import React, { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Navigation, AlertTriangle, Crosshair, MapPin } from 'lucide-react';
import L from '../lib/leaflet-setup';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { CATEGORY_COLORS } from '../config';
import { Language, i18n } from '../i18n';
import { calculateDistanceMeters, calculateWalkingMinutes, pxToLatLng } from '../lib/georef';
import { Category, Site } from '../types';

// Real geographic coordinates of IIT Roorkee campus (Main Building / Senate Hall / Century Gate)
const IIT_ROORKEE_CENTER: [number, number] = [29.8649, 77.8965];
const DEFAULT_ZOOM = 16;

interface CampusMapProps {
  sites: Site[];
  selectedCategory?: Category | 'all';
  onSelectSite: (site: Site) => void;
  userCoords?: [number, number] | null;
  onUserLocationUpdate?: (coords: [number, number]) => void;
  isPickingLocation?: boolean;
  onMapClick?: (coords: [number, number]) => void;
  pickedPx?: [number, number] | null;
  language: Language;
}

export const CampusMap: React.FC<CampusMapProps> = ({
  sites,
  selectedCategory = 'all',
  onSelectSite,
  userCoords: propUserCoords,
  onUserLocationUpdate,
  isPickingLocation = false,
  onMapClick,
  pickedPx,
  language,
}) => {
  const t = i18n[language];
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const pickedMarkerRef = useRef<L.Marker | null>(null);

  const [localUserCoords, setLocalUserCoords] = useState<[number, number] | null>(propUserCoords || null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Sync propUserCoords when changed externally
  useEffect(() => {
    if (propUserCoords) {
      setLocalUserCoords(propUserCoords);
    }
  }, [propUserCoords]);

  // Filter sites by category
  const filteredSites = sites.filter((s) => {
    if (!s.latlng && !s.px) return false;
    if (selectedCategory === 'all') return true;
    return s.accepts.includes(selectedCategory);
  });

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: IIT_ROORKEE_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: 13,
      maxZoom: 19,
      zoomControl: false, // We render custom accessible buttons
      attributionControl: true,
    });

    // OpenStreetMap standard tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Marker cluster group with Bin Saathi themed cluster badge styling
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let size = 38;
        let bgStyle = 'background-color: #2F3E46; color: #FFFFFF; border: 2px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.25);';
        if (count >= 20) {
          size = 46;
          bgStyle = 'background-color: #1F2C33; color: #FFFFFF; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 14px rgba(0,0,0,0.35);';
        } else if (count >= 10) {
          size = 42;
          bgStyle = 'background-color: #394C56; color: #FFFFFF; border: 2px solid #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';
        }
        return L.divIcon({
          html: `<div style="${bgStyle}; width:${size}px; height:${size}px;" class="flex items-center justify-center rounded-full font-bold text-xs sm:text-sm tracking-tight">${count}</div>`,
          className: 'custom-cluster-badge',
          iconSize: L.point(size, size),
          iconAnchor: L.point(size / 2, size / 2),
        });
      },
    });

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;
    mapInstanceRef.current = map;

    // Resize map once rendered
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timeout);
      map.remove();
      mapInstanceRef.current = null;
      clusterGroupRef.current = null;
    };
  }, []);

  // 2. Handle map click for picking location mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isPickingLocation) return;
      const clickedCoords: [number, number] = [
        Number(e.latlng.lat.toFixed(6)),
        Number(e.latlng.lng.toFixed(6)),
      ];
      if (onMapClick) {
        onMapClick(clickedCoords);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isPickingLocation, onMapClick]);

  // 3. Render / Update Waste Site Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const clusterGroup = clusterGroupRef.current;
    if (!map || !clusterGroup) return;

    clusterGroup.clearLayers();

    filteredSites.forEach((site) => {
      // Determine real lat/lng
      let siteLatLng: [number, number] | undefined = site.latlng;
      if (!siteLatLng && site.px) {
        siteLatLng = pxToLatLng(site.px);
      }
      if (!siteLatLng || siteLatLng.length !== 2) return;

      const isLarge = site.kind === 'large_site';
      const isCommunity = site.kind === 'community';

      // Build custom HTML marker icon
      let icon: L.DivIcon;
      if (isLarge) {
        icon = L.divIcon({
          className: 'large-site-icon',
          html: `
            <div class="relative flex flex-col items-center group cursor-pointer" title="${site.name}">
              <div class="flex items-center justify-center h-8 min-w-8 px-1.5 rounded-lg bg-red-600 text-white font-bold text-xs shadow-md border-2 border-white transition-transform group-hover:scale-115">
                <span>${site.id}</span>
              </div>
              <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-red-600 -mt-[1px]"></div>
            </div>
          `,
          iconSize: L.point(36, 38),
          iconAnchor: L.point(18, 38),
          popupAnchor: L.point(0, -36),
        });
      } else if (isCommunity) {
        icon = L.divIcon({
          className: 'community-site-icon',
          html: `
            <div class="relative flex flex-col items-center group cursor-pointer" title="${site.name}">
              <div class="flex items-center justify-center h-7 w-7 rounded-full bg-purple-600 text-white font-bold text-xs shadow-md border-2 border-white transition-transform group-hover:scale-115">
                ★
              </div>
              <div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-purple-600 -mt-[1px]"></div>
            </div>
          `,
          iconSize: L.point(28, 32),
          iconAnchor: L.point(14, 32),
          popupAnchor: L.point(0, -30),
        });
      } else {
        // Paired Public Bins (Wet/Green & Dry/Blue)
        icon = L.divIcon({
          className: 'bin-pair-icon',
          html: `
            <div class="relative flex flex-col items-center group cursor-pointer" title="${site.name}">
              <div class="flex items-center p-0.5 rounded-full bg-white shadow-md border border-neutral-300 transition-transform group-hover:scale-125">
                <span class="h-3 w-3 rounded-full bg-emerald-600 border border-white" title="Wet Waste"></span>
                <span class="h-3 w-3 rounded-full bg-blue-600 border border-white -ml-0.5" title="Dry Waste"></span>
              </div>
              <div class="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-neutral-400"></div>
            </div>
          `,
          iconSize: L.point(26, 22),
          iconAnchor: L.point(13, 22),
          popupAnchor: L.point(0, -20),
        });
      }

      const marker = L.marker([siteLatLng[0], siteLatLng[1]], { icon });

      // Calculate distance if user location is available
      let distanceText = '';
      if (localUserCoords) {
        const dist = calculateDistanceMeters(
          localUserCoords[0],
          localUserCoords[1],
          siteLatLng[0],
          siteLatLng[1]
        );
        const mins = calculateWalkingMinutes(dist);
        distanceText = dist < 1000 ? `${dist} m (${mins} min walk)` : `${(dist / 1000).toFixed(1)} km (~${mins} min walk)`;
      }

      // Accepted categories badges HTML
      const categoriesHtml = site.accepts
        .map((cat) => {
          const color = CATEGORY_COLORS[cat] || '#6B6B66';
          const label = t.categories[cat]?.label || cat;
          return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-[#1C1C1A] border border-neutral-200">
            <span class="h-2 w-2 rounded-full shrink-0" style="background-color: ${color}"></span>
            <span>${label}</span>
          </span>`;
        })
        .join('');

      // Available instructions
      let instructionsText = '';
      if (isLarge) {
        instructionsText = 'Bulk segregation depot for campus sweepings, hostel clearing, and departmental waste.';
      } else if (isCommunity) {
        instructionsText = site.notes || 'Community-contributed collection point. Verified by campus members.';
      } else {
        instructionsText = 'Paired bins: Organic/wet waste into Green bin; clean recyclable dry items into Blue bin.';
      }

      // Status badge
      let statusBadge = '';
      if (site.acceptsVerified || site.confirmations >= 3) {
        statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">Verified</span>`;
      } else if (isCommunity) {
        statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800">Community (${site.confirmations} confirmations)</span>`;
      } else {
        statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-700">Active</span>`;
      }

      // Popup Content Card
      const popupHtml = `
        <div class="p-3 text-left max-w-[270px] sm:max-w-[300px]">
          <div class="flex items-start justify-between gap-2">
            <div>
              <h3 class="font-bold text-sm text-[#1C1C1A] leading-snug">${site.name}</h3>
              <p class="text-[11px] text-[#6B6B66] mt-0.5">${site.area || 'IIT Roorkee Campus'}</p>
            </div>
            ${statusBadge}
          </div>

          <div class="mt-2.5">
            <div class="text-[10px] font-semibold uppercase tracking-wider text-[#6B6B66] mb-1">Waste Streams Accepted</div>
            <div class="flex flex-wrap gap-1">
              ${categoriesHtml}
            </div>
          </div>

          ${
            distanceText
              ? `<div class="mt-2 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                  📍 Distance: ${distanceText}
                </div>`
              : `<div class="mt-2 text-[11px] text-[#6B6B66] italic">
                  Tap 'Use my location' for walking distance
                </div>`
          }

          <div class="mt-2 text-[11px] text-[#4A4A45] bg-[#F5F5F0] p-2 rounded-lg border border-[#E6E5E0] leading-relaxed">
            ${instructionsText}
          </div>

          <button
            id="popup-btn-${site.id}"
            type="button"
            class="mt-3 w-full rounded-xl bg-[#2F3E46] py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#253238] transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>View Details & Directions</span>
            <span>&rarr;</span>
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'bs-clean-popup',
        maxWidth: 320,
        minWidth: 260,
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${site.id}`);
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            onSelectSite(site);
          };
        }
      });

      clusterGroup.addLayer(marker);
    });
  }, [filteredSites, localUserCoords, language, t, onSelectSite]);

  // 4. Update User Location Pin & Accuracy Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (localUserCoords) {
      const [lat, lng] = localUserCoords;

      if (!userMarkerRef.current) {
        const userIcon = L.divIcon({
          className: 'custom-user-location-marker',
          html: `
            <div class="relative flex items-center justify-center">
              <span class="absolute h-9 w-9 animate-ping rounded-full bg-blue-500 opacity-60"></span>
              <span class="relative h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-md"></span>
            </div>
          `,
          iconSize: L.point(36, 36),
          iconAnchor: L.point(18, 18),
        });

        userMarkerRef.current = L.marker([lat, lng], {
          icon: userIcon,
          zIndexOffset: 1000,
        }).addTo(map);

        userMarkerRef.current.bindPopup(
          `<div class="p-2 text-xs font-semibold text-[#1C1C1A]">You are here</div>`
        );
      } else {
        userMarkerRef.current.setLatLng([lat, lng]);
      }

      if (!userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current = L.circle([lat, lng], {
          radius: 35,
          color: '#3B82F6',
          fillColor: '#60A5FA',
          fillOpacity: 0.15,
          weight: 1.5,
        }).addTo(map);
      } else {
        userAccuracyCircleRef.current.setLatLng([lat, lng]);
      }
    } else {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current.remove();
        userAccuracyCircleRef.current = null;
      }
    }
  }, [localUserCoords]);

  // 5. Update Picked Location Marker (during Add Site on Map Tap)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pickedPx) {
      // Determine if pickedPx is lat/lng or pixel
      let latlng: [number, number];
      if (pickedPx[0] > 20 && pickedPx[0] < 40) {
        latlng = [pickedPx[0], pickedPx[1]];
      } else {
        latlng = pxToLatLng(pickedPx);
      }

      if (!pickedMarkerRef.current) {
        const pickedIcon = L.divIcon({
          className: 'picked-pin-icon',
          html: `
            <div class="relative flex flex-col items-center">
              <div class="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-600 text-white font-bold text-sm shadow-xl border-2 border-white animate-bounce">
                📍
              </div>
              <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-emerald-700 -mt-[1px]"></div>
            </div>
          `,
          iconSize: L.point(32, 38),
          iconAnchor: L.point(16, 38),
        });

        pickedMarkerRef.current = L.marker([latlng[0], latlng[1]], {
          icon: pickedIcon,
          zIndexOffset: 1200,
        }).addTo(map);
      } else {
        pickedMarkerRef.current.setLatLng([latlng[0], latlng[1]]);
      }
    } else {
      if (pickedMarkerRef.current) {
        pickedMarkerRef.current.remove();
        pickedMarkerRef.current = null;
      }
    }
  }, [pickedPx]);

  // Control handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(IIT_ROORKEE_CENTER, DEFAULT_ZOOM, {
        duration: 0.8,
      });
    }
  };

  // Browser Geolocation API "Use my location"
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          Number(position.coords.latitude.toFixed(6)),
          Number(position.coords.longitude.toFixed(6)),
        ];
        setLocalUserCoords(coords);
        setIsLocating(false);

        if (onUserLocationUpdate) {
          onUserLocationUpdate(coords);
        }

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(coords, 17, {
            duration: 1.2,
          });
        }
      },
      (error) => {
        console.warn('Geolocation failed:', error);
        setIsLocating(false);
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission denied. Please allow location access in your browser settings.'
            : 'Could not determine location. Please try again.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      }
    );
  };

  return (
    <div className="relative h-[52vh] sm:h-[62vh] md:h-[70vh] min-h-[400px] md:min-h-[540px] w-full overflow-hidden rounded-2xl border border-[#E6E5E0] bg-[#F5F5F0] shadow-inner select-none flex flex-col">
      {/* Top Banner: Picking Location Mode */}
      {isPickingLocation && (
        <div className="absolute left-3 right-3 top-3 z-30 flex items-center justify-between gap-2 rounded-xl border border-emerald-600 bg-emerald-700 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg backdrop-blur-xs animate-pulse">
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 shrink-0" />
            <span>{t.tapMapInstruction}</span>
          </div>
          <span className="text-[11px] underline opacity-90">Tap any spot on campus map</span>
        </div>
      )}

      {/* Location Error Toast */}
      {locationError && (
        <div className="absolute left-3 right-16 top-3 z-30 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/95 px-3 py-2 text-xs text-amber-900 shadow-md backdrop-blur-xs">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
          <span className="truncate flex-1">{locationError}</span>
          <button
            type="button"
            onClick={() => setLocationError(null)}
            className="text-amber-800 font-bold px-1.5 py-0.5 hover:bg-amber-100 rounded"
          >
            &times;
          </button>
        </div>
      )}

      {/* Floating Map Controls Toolbar */}
      <div className="absolute right-3 top-3 z-30 flex flex-col gap-2">
        {/* Primary Controls: Zoom & Reset */}
        <div className="flex flex-col gap-1 rounded-2xl border border-[#E6E5E0] bg-white/95 p-1 shadow-md backdrop-blur-sm">
          <button
            type="button"
            onClick={handleZoomIn}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-[#1C1C1A] hover:bg-neutral-100 active:scale-95 cursor-pointer min-h-[44px] min-w-[44px]"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-[#1C1C1A] hover:bg-neutral-100 active:scale-95 cursor-pointer min-h-[44px] min-w-[44px]"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-[#6B6B66] hover:bg-neutral-100 active:scale-95 cursor-pointer min-h-[44px] min-w-[44px]"
            aria-label="Reset to IIT Roorkee campus view"
            title="Reset to IIT Roorkee campus center"
          >
            <RotateCcw className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* "Use My Location" Quick Action Button */}
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#2F3E46] bg-[#2F3E46] text-white shadow-md hover:bg-[#253238] active:scale-95 cursor-pointer min-h-[44px] min-w-[44px]"
          aria-label="Use my location"
          title="Center on my current location"
        >
          <Navigation className={`h-5 w-5 ${isLocating ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Campus Coordinates Info Pill Bottom Left */}
      <div className="absolute left-3 bottom-3 z-30 hidden sm:flex items-center gap-1.5 rounded-xl border border-[#E6E5E0]/80 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#6B6B66] shadow-xs backdrop-blur-xs">
        <MapPin className="h-3.5 w-3.5 text-[#2F3E46]" />
        <span>IIT Roorkee (29.865°N, 77.897°E)</span>
        <span className="text-neutral-300">•</span>
        <span>{filteredSites.length} sites</span>
      </div>

      {/* Leaflet Map DOM Container */}
      <div
        ref={mapContainerRef}
        className={`h-full w-full z-10 ${isPickingLocation ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
      />
    </div>
  );
};
