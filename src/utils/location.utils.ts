import * as turf from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

export function isPointInPolygon(lat: number, lng: number, polygon: any): boolean {
    if (!polygon || !polygon.coordinates || polygon.coordinates.length === 0) {
        return false;
    }

    const pt = turf.point([lng, lat]); // Turf uses [lng, lat]
    const poly = turf.polygon(polygon.coordinates);

    return booleanPointInPolygon(pt, poly);
}
