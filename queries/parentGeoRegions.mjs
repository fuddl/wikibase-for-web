export const parentGeoRegions = {
    id: 'parentGeoRegions',
    requiredProps: ['coordinatesOfEasternmostPoint', 'coordinatesOfNorthernmostPoint', 'coordinatesOfSouthernmostPoint', 'coordinatesOfWesternmostPoint'],
    query: ({ instance, params }) => {
        const props = [];
        if ('location' in instance.props) {
            props.push(instance.props.location);
        }
        if ('locatedInTheAdministrativeTerritorialEntity' in instance.props) {
            props.push(instance.props.locatedInTheAdministrativeTerritorialEntity);
        }
        if ('locatedInOrOnPhysicalFeature' in instance.props) {
            props.push(instance.props.locatedInOrOnPhysicalFeature);
        }
        return `
            SELECT ?parent ?parentLabel ?westPoint ?southPoint ?eastPoint ?northPoint WHERE {
            wd:${params.item} (${props.map(prop => `t:${prop}`).join('|')})+ ?parent .
            ?parent t:${instance.props.coordinatesOfWesternmostPoint} ?westPoint. 
            ?parent t:${instance.props.coordinatesOfSouthernmostPoint} ?southPoint. 
            ?parent t:${instance.props.coordinatesOfEasternmostPoint} ?eastPoint. 
            ?parent t:${instance.props.coordinatesOfNorthernmostPoint} ?northPoint. 
            
            SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
            }
  `;
    },
    cacheTag: ({ params }) => `parentGeoRegions:${params.item}`,
    parseWikidataPoint(pointStr) {
        if (!pointStr) return null;
        // Matches the numbers inside Point(long lat)
        const match = pointStr.match(/Point\(([-\d.]+)\s+([-\d.]+)\)/);
        if (match) {
            return {
                lng: parseFloat(match[1]),
                lat: parseFloat(match[2])
            };
        }
        return null;
    },
    postProcess: ({ results }, params, instance) => {
        const bindings = results.bindings;
        const parseWikidataPoint = parentGeoRegions.parseWikidataPoint;

        const getBboxSize = (bbox) => {
            if (!bbox) return Infinity;
            const [west, south, east, north] = bbox;
            let width = east - west;
            if (width < 0) {
                width += 360;
            }
            const height = Math.abs(north - south);
            return width * height;
        };

        const regions = bindings.map(row => {
            // Extract raw string values safely
            const west = parseWikidataPoint(row.westPoint?.value);
            const south = parseWikidataPoint(row.southPoint?.value);
            const east = parseWikidataPoint(row.eastPoint?.value);
            const north = parseWikidataPoint(row.northPoint?.value);

            return {
                parent: row.parent.value,
                label: row.parentLabel.value,
                // Create a clean bounding box object if data exists
                bbox: west && south && east && north ? [west.lng, south.lat, east.lng, north.lat] : null
            };
        });

        regions.sort((a, b) => getBboxSize(a.bbox) - getBboxSize(b.bbox));

        return regions;
    },
};
