const Utils = require('../utils.js');
const Versions = require('../versions.js');

const NO_VERSION = "0.0.0";

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
            if (capabilities.endpoints.filter(e => e.path === '/file_formats' || e.path === '/conformance' || e.path === '/files').length > 0) {
                return "1.0.0";
            }
            else if (capabilities.endpoints.filter(e => e.path === '/output_formats' || e.path === '/files/{user_id}').length > 0) {
                return "0.4.2";
            }
            else if (!capabilities.backend_version && !capabilities.title && !capabilities.description && !capabilities.links) {
                return "0.3.1";
            }
        }

        // Can't determine version
        return NO_VERSION;
    }

    // Always returns a copy of the input object
    static convertCapabilitiesToLatestSpec(originalCapabilities, version = null, updateVersionNumbers = true, updateEndpointPaths = true, id = "unknown", title = "Unknown", backend_version = "Unknown") {
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
        if (!Array.isArray(capabilities.links)) {
            capabilities.links = [];
        }

        return capabilities;
    }

    // Always returns a copy of the input object
    static convertBillingToLatestSpec(originalBilling, version) {
        if (Versions.compare(version, "0.3.x", "<=")) {
            throw "Migrating from API version 0.3.0 and older is not supported.";
        }
        let billing = {};
        if (Utils.isObject(originalBilling)) {
            billing = Utils.deepClone(originalBilling);
        }

        if (typeof billing.currency !== 'string') {
            billing.currency = null;
        }

        return billing;
    }

    // Always returns a copy of the input object
    static convertEndpointsToLatestSpec(originalEndpoints, version, updatePaths = false) {
        if (Versions.compare(version, "0.3.x", "<=")) {
            throw "Migrating from API version 0.3.0 and older is not supported.";
        }
        if (!Array.isArray(originalEndpoints)) {
            return [];
        }
        let endpoints = Utils.deepClone(originalEndpoints);
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

    // Alias for convertFileFormatsToLatestSpec
    static convertOutputFormatsToLatestSpec(originalFormats, version) {
        return this.convertFileFormatsToLatestSpec(originalFormats, version);
    }

    // Always returns a copy of the input object
    static convertFileFormatsToLatestSpec(originalFormats, version) {
        if (Versions.compare(version, "0.3.x", "<=")) {
            throw "Migrating from API version 0.3.0 and older is not supported.";
        }
        let formats = {};
        if (Utils.isObject(originalFormats)) {
            formats = Utils.deepClone(originalFormats);
        }

        if (Versions.compare(version, "0.4.x", "=") && Utils.isObject(formats)) {
            formats = {
                output: formats
            };
        }

        if (!Utils.isObject(formats.input)) {
            formats.input = {};
        }
        if (!Utils.isObject(formats.output)) {
            formats.output = {};
        }

        return formats;
    }

    // Always returns a copy of the input object
    static convertServiceTypesToLatestSpec(originalTypes, version) {
        if (Versions.compare(version, "0.3.x", "<=")) {
            throw "Migrating from API version 0.3.0 and older is not supported.";
        }
        let types = {};
        if (Utils.isObject(originalTypes)) {
            types = Utils.deepClone(originalTypes);
        }
        if (Versions.compare(version, "0.4.x", "=")) {
            for(let t in types) {
                if (!Utils.isObject(types[t])) {
                    types[t] = {};
                    continue;
                }

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
        }
        return types;
    }

    // Always returns a copy of the input object
    static convertUdfRuntimesToLatestSpec(originalRuntimes, version) {
        if (Versions.compare(version, "0.3.x", "<=")) {
            throw "Migrating from API version 0.3.0 and older is not supported.";
        }
        let runtimes = Utils.deepClone(originalRuntimes);
        // Nothing to do, was not supported in 0.3 and nothing changed in 0.4.
        if (Versions.compare(version, "0.4.x", "=")) {
            for(let r in runtimes) {
                if (!Utils.isObject(runtimes[r])) {
                    delete runtimes[r];
                    continue;
                }

                // null is not allowed any longer, replace with empty string
                if (runtimes[r].description === null) {
                    runtimes[r].description = "";
                }
            }
        }
        return runtimes;
    }

}

module.exports = MigrateCapabilities;