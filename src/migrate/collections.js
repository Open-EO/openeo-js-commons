const Utils = require('../utils.js');
const Versions = require('../versions.js');
const MigrateCommons = require('./commons.js');

const extMap = {
    "cube": "datacube",
    "eo": "eo",
    "label": "label",
    "pc": "pointcloud",
    "proj": "projection",
    "sar": "sar",
    "sat": "sat",
    "sci": "scientific",
    "view": "view"
};

const fieldMap = {
    // Item to core
    'item:license': 'license',
    'item:providers': 'providers',
    // EO to core
    'eo:instrument': 'instruments',
    'eo:platform': 'platform',
    'eo:constellation': 'constellation',
    // EO to proj
    'eo:epsg': 'proj:epsg',
    // EO to view
    'eo:off_nadir': 'view:off_nadir',
    'eo:azimuth': 'view:azimuth',
    'eo:sun_azimuth': 'view:sun_azimuth',
    'eo:sun_elevation': 'view:sun_elevation',
    // Datetime Range to core
    'dtr:start_datetime': 'start_datetime',
    'dtr:end_datetime': 'end_datetime',
    // Point Cloud
    'pc:schema': 'pc:schemas',
    // SAR rename
    'sar:type': 'sar:product_type',
    'sar:polarization': 'sar:polarizations',
    // SAR to core
    'sar:instrument': 'instruments',
    'sar:platform': 'platform',
    'sar:constellation': 'constellation',
    // SAR to sat
    'sar:off_nadir': 'sat:off_nadir_angle',
    'sar:relative_orbit': 'sat:relative_orbit',
// The following four fields don't translate directly, see code below
    'sar:pass_direction': 'sat:orbit_state',
//   sar:resolution => sar:resolution_range, sar:resolution_azimuth
//   sar:pixel_spacing => sar:pixel_spacing_range, sar:pixel_spacing_azimuth
//   sar:looks => sar:looks_range, sar:looks_azimuth, sar:looks_equivalent_number (opt)
};

const moveToRoot = [
    'cube:dimensions',
    'sci:publications',
    'sci:doi',
    'sci:citation'
];

const DIMENSION_TYPES = [
    'spatial',
    'temporal',
    'bands',
    'other'
];


/** Migrate Collections related responses to the latest version. */
class MigrateCollections {

    /**
     * Converts a `GET /collections` response to the latest version.
     * 
     * Always returns a deep copy of the input object.
     * 
     * @param {object} response - The response to convert
     * @param {string} version - Version number of the API, which the response conforms to
     * @returns {object}
     */
    static convertCollectionsToLatestSpec(response, version) {
        if (Versions.compare(version, "0.3.x", "<=")) {
            throw "Migrating from API version 0.3.0 and older is not supported.";
        }

        // Make sure we don't alter the original object
        response = Utils.deepClone(response);

        if (Array.isArray(response.collections)) {
            response.collections = response.collections
                .map(c => MigrateCollections.convertCollectionToLatestSpec(c, version))
                .filter(c => typeof c.id === 'string');
        }
        else {
            response.collections = [];
        }

        response.links = MigrateCommons.migrateLinks(response.links, version);

        return response;
    }

    /**
     * Converts a single collection to the latest version.
     * 
     * Always returns a deep copy of the input object.
     * 
     * @param {object} process - The collection to convert
     * @param {string} version - Version number of the API, which the collection conforms to
     * @returns {object}
     */
    static convertCollectionToLatestSpec(originalCollection, version) {
        if (Versions.compare(version, "0.3.x", "<=")) {
            throw "Migrating from API version 0.3.0 and older is not supported.";
        }

        // Make sure we don't alter the original object
        let collection = Utils.deepClone(originalCollection);

        // If collection has no id => seems to be an invalid collection => abort
        if (typeof collection.id !== 'string' || collection.id.length === 0) {
            return {};
        }

        // Update stac_version
        if (!Versions.validate(collection.stac_version) || Versions.compare(collection.stac_version, "0.9.0", "<")) {
            collection.stac_version = "0.9.0";
        }

        // Add missing extent upfront. Makes the following code simpler as it works on the object.
        if (!Utils.isObject(collection.extent)) {
            collection.extent = {};
        }

        // convert v0.4 collections to latest version
        if (Versions.compare(version, "0.4.x", "=")) {
            // Restructure spatial extent
            if (Array.isArray(collection.extent.spatial)) {
                collection.extent.spatial = {
                    bbox: [
                        collection.extent.spatial
                    ]
                };
            }
            // Restructure temporal extent
            if (Array.isArray(collection.extent.temporal)) {
                collection.extent.temporal = {
                    interval: [
                        collection.extent.temporal
                    ]
                };
            }

            // move properties to other_properties
            if (Utils.isObject(collection.properties)) {
                if (!Utils.isObject(collection.other_properties)) {
                    collection.other_properties = {};
                }
                for(let key in collection.properties) {
                    collection.other_properties[key] = {
                        values: [
                            collection.properties[key]
                        ]
                    };
                }
            }
            delete collection.properties;

            // now we can work on all properties and migrate to summaries
            let props = Utils.isObject(collection.other_properties) ? collection.other_properties : {};
            for(let key in props) {
                let val = props[key];
                if (Utils.isObject(val) && (Array.isArray(val.extent) || Array.isArray(val.values))) {
                    if (Array.isArray(val.extent)) {
                        props[key] = {
                            min: val.extent[0],
                            max: val.extent[1]
                        };
                    }
                    else { // val.values is an array
                        if (val.values.findIndex(v => !Array.isArray(v)) === -1) {
                            if (val.values.length <= 1) {
                                props[key] = val.values[0];
                            }
                            else {
                                props[key] = val.values.reduce((a, b) => a.concat(b));
                            }
                        }
                        else {
                            props[key] = val.values;
                        }
                    }
                }
                else {
                    // If not valid, move to top-level
                    if (typeof collection[key] === 'undefined') {
                        collection[key] = val;
                    }
                    delete props[key];
                }
            }
            delete collection.other_properties;

            if (!Utils.isObject(collection.summaries)) {
                collection.summaries = {};
            }
            for(let key in props) {
                let val = props[key];

                if (key === 'sar:pass_direction') {
                    // Convert null to geostationary
                    val = val.map(v => v === null ? 'geostationary' : v);
                }

                // Convert arrays into separate fields as needed for some SAR fields
                if ((key === 'sar:resolution' || key === 'sar:pixel_spacing' || key === 'sar:looks') && Array.isArray(val) && val.length >= 2) {
                    collection.summaries[key + '_range'] = val.slice(0,1);
                    collection.summaries[key + '_azimuth'] = val.slice(1,2);
                    if (val.length > 2) {
                        collection.summaries[key + '_equivalent_number'] = val.slice(2,3);
                    }
                }
                // Do the renaming of fields
                else if (typeof fieldMap[key] === 'string') {
                    collection.summaries[fieldMap[key]] = val;
                }
                // Move invalid summaries to the top level
                else if (moveToRoot.includes(key) && Array.isArray(val) && val.length === 1) {
                    collection[key] = val[0];
                }
                // Do the general conversion
                else {
                    collection.summaries[key] = val;
                }
            }
        }

        // Add missing required fields
        if (typeof collection.description !== 'string') {
            collection.description = "";
        }
        if (!Utils.isObject(collection.extent.spatial)) {
            collection.extent.spatial = {};
        }
        if (!Utils.isObject(collection.extent.temporal)) {
            collection.extent.temporal = {};
        }
        if (typeof collection.license !== 'string') {
            collection.license = "proprietary";
        }
        if (!Utils.isObject(collection.summaries)) {
            collection.summaries = {};
        }
        if (!Utils.isObject(collection['cube:dimensions'])) {
            collection['cube:dimensions'] = {};
        }
        else {
            for(var name in collection['cube:dimensions']) {
                if (Utils.isObject(collection['cube:dimensions'][name]) && !DIMENSION_TYPES.includes(collection['cube:dimensions'][name].type)) {
                    collection['cube:dimensions'][name].type = 'other';
                }
            }
        }

        // Fix links
        collection.links = MigrateCommons.migrateLinks(collection.links);

        // Fix stac_extensions
        var extensions = Array.isArray(collection.stac_extensions) ? collection.stac_extensions : [];
        for(var key in collection) {
            let ext = null;
            let prefix = key.split(':', 1);
            if (key === 'deprecated' || key === 'version') {
                ext = 'version';
            }
            else if (typeof extMap[prefix] === 'string') {
                ext = extMap[prefix];
            }

            if (ext !== null && !extensions.includes(ext)) {
                extensions.push(ext);
            }
        }
        extensions.sort();
        collection.stac_extensions = extensions;

        return collection;
    }

}

module.exports = MigrateCollections;