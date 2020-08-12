const Utils = require('../utils.js');
const Versions = require('../versions.js');
const MigrateCommons = require('./commons.js');

const NO_VERSION = "0.0.0";

/** Migrate capabilities related responses to the latest version. */
class MigrateCapabilities {

    /**
     * Tries to determine the API version from the capabilities object.
     * 
     * Returns the version number, e.g. "0.4.2", "1.0.0" or "0.0.0" (if unknown).
     * 
     * @param {object} capabilities 
     * @returns {string}
     */
    static guessApiVersion(capabilities) {
        // No object passed
        if (!Utils.isObject(capabilities)) {
            return NO_VERSION;
        }

        // Get exact info from version fields
        if (Versions.validate(capabilities.api_version)) {
            return capabilities.api_version;
        }
        else if (Versions.validate(capabilities.version)) {
            return capabilities.version;
        }
        // Now we are really guessing
        else if (Array.isArray(capabilities.endpoints)) {
            if (capabilities.endpoints.find(e => e.path === '/file_formats' || e.path === '/conformance' || e.path === '/files')) {
                return "1.0.0";
            }
            else if (capabilities.endpoints.find(e => e.path === '/output_formats' || e.path === '/files/{user_id}')) {
                return "0.4.2";
            }
            else if (!capabilities.backend_version && !capabilities.title && !capabilities.description && !capabilities.links) {
                return "0.3.1";
            }
        }

        // Can't determine version
        return NO_VERSION;
    }

    /**
     * Converts a `GET /` response to the latest version.
     * 
     * Always returns a deep copy of the input object.
     * 
     * @param {object} response - The response to convert
     * @param {string|null} version - Version number of the API, which the response conforms to. If `null`, tries to guess the version with `guessApiVersion()`.
     * @param {boolean} updateVersionNumbers - Should version numbers in the response be updated?
     * @param {boolean} updateEndpointPaths - Should the endpoint paths be updated to their recent equivalents?
     * @param {string} id - If no id is set in the response, sets it to the value specified here. Defaults to `unknown`.
     * @param {string} title - If no title is set in the response, sets it to the value specified here. Defaults to `Unknown`.
     * @param {string} title - If no backend_version is set in the response, sets it to the value specified here. Defaults to `0.0.0`.
     * @returns {object}
     */
    static convertCapabilitiesToLatestSpec(originalCapabilities, version = null, updateVersionNumbers = true, updateEndpointPaths = true, id = "unknown", title = "Unknown", backend_version = "0.0.0") {
        if (version === null) {
            version = this.guessApiVersion(originalCapabilities);
        }
        // Return empty if version number is not available
        if (version === NO_VERSION) {
            return {};
        }

        if (Versions.compare(version, "0.3.x", "<=")) {
            throw "Migrating from API version 0.3.0 and older is not supported.";
        }

        let capabilities = Utils.deepClone(originalCapabilities);
        // Fill & Update version number
        if (!updateVersionNumbers) {
            capabilities.api_version = version;
        }
        else {
            capabilities.api_version = "1.0.0";
        }

        // Convert billing plans
        if (Utils.isObject(capabilities.billing)) {
            capabilities.billing = this.convertBillingToLatestSpec(capabilities.billing, version);
        }
        else {
            delete capabilities.billing;
        }

        // Convert endpoints
        capabilities.endpoints = this.convertEndpointsToLatestSpec(capabilities.endpoints, version, updateEndpointPaths);

        // Fill STAC Version field
        if (!updateVersionNumbers && Versions.compare(version, "0.4.x", "=")) {
            capabilities.stac_version = "0.6.2";
        }
        else if (updateVersionNumbers || typeof capabilities.stac_version !== 'string') {
            capabilities.stac_version = "0.9.0";
        }

        // Add missing fields with somewhat useful data
        if (typeof capabilities.production !== 'boolean') {
            capabilities.production = Versions.compare(version, "1.0.0-rc.1", "=") || Versions.compare(version, "1.0.0-rc.2", "=") ? true : false;
        }
        if (typeof capabilities.backend_version !== 'string') {
            capabilities.backend_version = backend_version;
        }
        if (typeof capabilities.id !== 'string') {
            capabilities.id = id;
        }
        if (typeof capabilities.title !== 'string') {
            capabilities.title = title;
        }
        if (typeof capabilities.description !== 'string') {
            capabilities.description = "";
        }
        capabilities.links = MigrateCommons.migrateLinks(capabilities.links, version);

        return capabilities;
    }

    /**
     * Converts the billing part of the `GET /` response to the latest version.
     * 
     * Always returns a deep copy of the input object.
     * 
     * @param {object} billing - The response to convert
     * @param {string} version - Version number of the API, which the response conforms to
     * @returns {object}
     */
    static convertBillingToLatestSpec(billing, version) {
        if (Versions.compare(version, "0.3.x", "<=")) {
            throw "Migrating from API version 0.3.0 and older is not supported.";
        }
        if (Utils.isObject(billing)) {
            billing = Utils.deepClone(billing);
        }
        else {
            billing = {};
        }

        if (typeof billing.currency !== 'string') {
            billing.currency = null;
        }

        return billing;
    }

    /**
     * Converts the endpoints part of the `GET /` response to the latest version.
     * 
     * Always returns a deep copy of the input object.
     * 
     * @param {array} endpoints - The response to convert
     * @param {string} version - Version number of the API, which the response conforms to
     * @param {boolean} updatePaths - Should the endpoint paths be updated to their recent equivalents?
     * @returns {array}
     */
    static convertEndpointsToLatestSpec(endpoints, version, updatePaths = false) {
        if (Versions.compare(version, "0.3.x", "<=")) {
            throw "Migrating from API version 0.3.0 and older is not supported.";
        }
        if (!Array.isArray(endpoints)) {
            return [];
        }
        endpoints = Utils.deepClone(endpoints);
        // convert v0.4 endpoints to v1.0
        if (updatePaths) {
            let isV04 = Versions.compare(version, "0.4.x", "=");
            let isLtV100RC2 = Versions.compare(version, "1.0.0-rc.2", "<");

            let addPutToPg = function(endpoints) {
                let newPgPath = '/process_graphs/{process_graph_id}';
                let i = endpoints.findIndex(e => e.path === newPgPath);
                if (i >= 0) {
                    if (endpoints[i].methods.indexOf('PUT') === -1) {
                        endpoints[i].methods.push('PUT');
                    }
                }
                else {
                    endpoints.push({
                        path: newPgPath,
                        methods: ['PUT']
                    });
                }
                return endpoints;
            };

            for(var i in endpoints) {
                let e = endpoints[i];
                if (isV04) {
                    switch (e.path) {
                        case '/output_formats':
                            e.path = '/file_formats';
                            break;
                        case '/files/{user_id}':
                            e.path = '/files';
                            break;
                        case '/files/{user_id}/{path}':
                            e.path = '/files/{path}';
                            break;
                    }
                }
                if (isLtV100RC2) {
                    switch (e.path) {
                        case '/process_graphs':
                            let post = e.methods.indexOf('POST');
                            if (post >= 0) {
                                e.methods.splice(post, 1);
                                addPutToPg(endpoints);
                            }
                            break;
                        case '/process_graphs/{process_graph_id}':
                            let patch = e.methods.indexOf('PATCH');
                            if (patch >= 0) {
                                e.methods.splice(patch, 1);
                                addPutToPg(endpoints);
                            }
                            break;
                    }
                }
            }
        }
        return endpoints;
    }

    /**
     * Alias for `convertFileFormatsToLatestSpec()`.
     * 
     * @alias MigrateCapabilities.convertFileFormatsToLatestSpec
     * @deprecated
     * @param {object} formats - The response to convert
     * @param {string} version - Version number of the API, which the response conforms to
     * @returns {object}
     */
    static convertOutputFormatsToLatestSpec(formats, version) {
        return this.convertFileFormatsToLatestSpec(formats, version);
    }

    /**
     * Converts a `GET /file_formats` response to the latest version.
     * 
     * Always returns a deep copy of the input object.
     * 
     * @param {object} formats - The response to convert
     * @param {string} version - Version number of the API, which the response conforms to
     * @returns {object}
     */
    static convertFileFormatsToLatestSpec(formats, version) {
        if (Versions.compare(version, "0.3.x", "<=")) {
            throw "Migrating from API version 0.3.0 and older is not supported.";
        }
        if (Utils.isObject(formats)) {
            formats = Utils.deepClone(formats);
        }
        else {
            formats = {};
        }

        if (Versions.compare(version, "0.4.x", "=") && Utils.isObject(formats)) {
            formats = {
                output: formats
            };
        }

        formats.input = upgradeFileFormats(formats.input, version);
        formats.output = upgradeFileFormats(formats.output, version);

        return formats;
    }

    /**
     * Converts a `GET /service_types` response to the latest version.
     * 
     * Always returns a deep copy of the input object.
     * 
     * @param {object} types - The response to convert
     * @param {string} version - Version number of the API, which the response conforms to
     * @returns {object}
     */
    static convertServiceTypesToLatestSpec(types, version) {
        if (Versions.compare(version, "0.3.x", "<=")) {
            throw "Migrating from API version 0.3.0 and older is not supported.";
        }
        if (!Utils.isObject(types)) {
            return {};
        }

        types = Utils.deepClone(types);
        for(let t in types) {
            if (!Utils.isObject(types[t])) {
                types[t] = {};
            }
            if (Versions.compare(version, "0.4.x", "=")) {
                // Remove attributes
                delete types[t].attributes;

                // Rename parameters to configuration
                if (Utils.isObject(types[t].parameters)) {
                    types[t].configuration = types[t].parameters;
                }
                delete types[t].parameters;

                // Rename variables to process_parameters
                if (Array.isArray(types[t].variables)) {
                    types[t].process_parameters = types[t].variables.map(v => {
                        let param = {
                            name: v.variable_id,
                            description: typeof v.description === 'string' ? v.description : "",
                            schema: {
                                type: [
                                    typeof v.type === 'string' ? v.type : "string",
                                    "null"
                                ]
                            }
                        };
                        if (typeof v.default !== 'undefined') {
                            param.default = v.default;
                        }
                        return param;
                    });
                }
                delete types[t].variables;
            }

            if (!Utils.isObject(types[t].configuration)) {
                types[t].configuration = {};
            }
            else {
                types[t].configuration = MigrateCommons.migrateDiscoveryParameters(types[t].configuration, version);
            }

            if (!Array.isArray(types[t].process_parameters)) {
                types[t].process_parameters = [];
            }

            if (typeof types[t].links !== 'undefined') { // links not required, so only apply if defined anyway
                types[t].links = MigrateCommons.migrateLinks(types[t].links, version);
            }
        }
        return types;
    }

    /**
     * Converts a `GET /udf_runtimes` response to the latest version.
     * 
     * Always returns a deep copy of the input object.
     * 
     * @param {object} runtimes - The response to convert
     * @param {string} version - Version number of the API, which the response conforms to
     * @returns {object}
     */
    static convertUdfRuntimesToLatestSpec(runtimes, version) {
        if (Versions.compare(version, "0.3.x", "<=")) {
            throw "Migrating from API version 0.3.0 and older is not supported.";
        }
        if (!Utils.isObject(runtimes)) {
            return {};
        }

        runtimes = Utils.deepClone(runtimes);
        for(let r in runtimes) {
        // Nothing to do, was not supported in 0.3 and nothing changed in 0.4.
            if (Versions.compare(version, "0.4.x", "=")) {
                if (!Utils.isObject(runtimes[r])) {
                    delete runtimes[r];
                    continue;
                }

                // null is not allowed any longer, replace with empty string
                if (runtimes[r].description === null) {
                    runtimes[r].description = "";
                }
            }

            if (typeof runtimes[r].type !== 'string') {
                if (typeof runtimes[r].docker === 'string') {
                    runtimes[r].type = 'docker';
                }
                else {
                    runtimes[r].type = 'language';
                }
            }

            if (typeof runtimes[r].links !== 'undefined') { // links not required, so only apply if defined anyway
                runtimes[r].links = MigrateCommons.migrateLinks(runtimes[r].links, version);
            }
        }

        return runtimes;
    }

}

const GIS_DATA_TYPES = ['raster', 'vector', 'table', 'other'];

function upgradeFileFormats(formats, version) {
    if (!Utils.isObject(formats)) {
        formats = {};
    }
    for(let id in formats) {
        if (!Utils.isObject(formats[id].parameters)) {
            formats[id].parameters = {};
        }
        else {
            formats[id].parameters = MigrateCommons.migrateDiscoveryParameters(formats[id].parameters, version);
        }

        // Can be empty: https://github.com/Open-EO/openeo-api/issues/325
        if (!Array.isArray(formats[id].gis_data_types)) {
            formats[id].gis_data_types = [];
        }
        else {
            formats[id].gis_data_types = formats[id].gis_data_types.filter(t => GIS_DATA_TYPES.includes(t));
        }

        if (typeof formats[id].links !== 'undefined') { // links not required, so only apply if defined anyway
            formats[id].links = MigrateCommons.migrateLinks(formats[id].links, version);
        }
    }
    return formats;
}

module.exports = MigrateCapabilities;