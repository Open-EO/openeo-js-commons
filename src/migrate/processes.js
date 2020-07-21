const Utils = require('../utils.js');
const Versions = require('../versions.js');
const MigrateCommons = require('./commons.js');

/** Migrate processes related responses to the latest version. */
class MigrateProcesses {

    /**
     * Converts a `GET /process` response to the latest version.
     * 
     * Always returns a deep copy of the input object.
     * 
     * @param {object} response - The response to convert
     * @param {string} version - Version number of the API, which the response conforms to
     * @returns {object}
     */
    static convertProcessesToLatestSpec(response, version) {
        if (Versions.compare(version, "0.3.x", "<=")) {
            throw "Migrating from API version 0.3.0 and older is not supported.";
        }

        // Make sure we don't alter the original object
        response = Utils.deepClone(response);

        if (Array.isArray(response.processes)) {
            response.processes = response.processes
                .map(p => MigrateProcesses.convertProcessToLatestSpec(p, version))
                .filter(p => typeof p.id === 'string');
        }
        else {
            response.processes = [];
        }

        response.links = MigrateCommons.migrateLinks(response.links, version);

        return response;
    }

    /**
     * Converts a single process to the latest version.
     * 
     * Always returns a deep copy of the input object.
     * 
     * @param {object} process - The process to convert
     * @param {string} version - Version number of the API, which the process conforms to
     * @returns {object}
     */
    static convertProcessToLatestSpec(process, version) {
        if (Versions.compare(version, "0.3.x", "<=")) {
            throw "Migrating from API version 0.3.0 and older is not supported.";
        }

        // Make sure we don't alter the original object
        process = Utils.deepClone(process);

        // If process has no id => seems to be an invalid process => abort
        if (typeof process.id !== 'string' || process.id.length === 0) {
            return {};
        }

        // Convert the parameters from object to array
        if (Versions.compare(version, "0.4.x", "=")) {
            // Determine the parameter order
            if (!Array.isArray(process.parameter_order) || process.parameter_order.length === 0) {
                process.parameter_order = [];
                for(let param in process.parameters) {
                    process.parameter_order.push(param);
                }
            }
    
            // Upgrade parameters and convert from array to object
            let params = [];
            for(let name of process.parameter_order) {
                // Add name 
                let obj = {name: name};
                if (Utils.isObject(process.parameters[name])) {
                    Object.assign(obj, process.parameters[name]);
                }

                // Migrate from required to optional
                if (!obj.required) {
                    obj.optional = true;
                }
                delete obj.required;

                // Add to list of ordered params
                params.push(obj);
            }
            delete process.parameter_order;
            process.parameters = params;
        }

        // Set required field description if not a string
        if (typeof process.description !== 'string') {
            process.description = "";
        }

        // Update parameters
        if (Array.isArray(process.parameters)) {
            for (var i = process.parameters.length-1; i >= 0; i--) {
                let param = process.parameters[i];
                if (!Utils.isObject(param)) {
                    process.parameters.splice(i, 1);
                    continue;
                }

                // Set required field description if not a string
                if (typeof param.description !== 'string') {
                    param.description = "";
                }

                // Upgrade parameter schema
                process.parameters[i] = upgradeSchema(param, version);
            }
        }
        else {
            process.parameters = [];
        }

        // Update return value
        if (!Utils.isObject(process.returns)) {
            process.returns = {};
        }
        process.returns = upgradeSchema(process.returns, version, false);

        // Remove process graphs from examples (and ensure there are arguments given)
        if (Array.isArray(process.examples)) {
            process.examples = process.examples.filter(example => Utils.isObject(example) && Utils.isObject(example.arguments));
        }

        if (typeof process.links !== 'undefined') { // links not required, so only apply if defined anyway
            process.links = MigrateCommons.migrateLinks(process.links, version);
        }

        // Update process graph -> nothing to do yet

        return process;
    }

}
    
function upgradeSchema(obj, version, isParam = true) {
    var schema = {};
    if (obj.schema && typeof obj.schema === 'object') { // array or object?
        schema = obj.schema;
    }

    if (Versions.compare(version, "0.4.x", "=")) {
        // Remove anyOf/oneOf wrapper
        for(let type of ['anyOf', 'oneOf']) {
            if (Array.isArray(schema[type])) {
                // Parameters only: Move default value to parameter-level
                if (isParam && typeof schema.default !== 'undefined') {
                    obj.default = schema.default;
                }
                // Move array one level up, removing anyOf and oneOf
                schema = schema[type];
                break;
            }
        }

        let moveMediaType = (Versions.compare(version, "0.4.x") <= 0 && typeof obj.media_type !== 'undefined');
        let schemas = Array.isArray(schema) ? schema : [schema];
        for(let subSchema of schemas) {
            // Rename format to subtype recursively
            subSchema = renameFormat(subSchema);

            // Parameters only: Move default value to parameter-level
            if (isParam && typeof subSchema.default !== 'undefined') {
                obj.default = subSchema.default;
                delete subSchema.default;
            }

            // Replace media_type field with contentMediaType from JSON Schemas
            if (moveMediaType) {
                subSchema.contentMediaType = obj.media_type;
            }
        }

        // Remove the media type
        if (moveMediaType) {
            delete obj.media_type;
        }
    }

    // Clients SHOULD automatically set `optional` to `true`, if a default value is specified.
    if (Versions.compare(version, "0.4.x", ">")) {
        if (typeof obj.default !== 'undefined') {
            obj.optional = true;
        }
    }

    obj.schema = schema;
    return obj;
}

function renameFormat(schema) {
    if (Utils.isObject(schema) && typeof schema.type !== 'undefined' && typeof schema.format === 'string') {
        switch(schema.format) {
            case 'url':
                schema.format = 'uri';
                break;
            case 'proj-definition':
                schema.deprecated = true;
                break;
            case 'callback':
                schema.format = 'process-graph';
                if (Utils.isObject(schema.parameters)) {
                    let params = [];
                    for(let name in schema.parameters) {
                        let paramSchema = schema.parameters[name];
                        let param = {
                            name: name,
                            description: typeof paramSchema.description === 'string' ? paramSchema.description : "",
                            schema: paramSchema
                        };
                        params.push(param);
                    }
                    schema.parameters = params;
                }
                break;
        }

        schema.subtype = schema.format;
        // Leave format for "well-known" formats defined in JSON Schema
        if (!['date-time', 'time', 'date', 'uri'].includes(schema.format)) {
            delete schema.format;
        }
    }
    for(let i in schema) {
        if (schema[i] && typeof schema[i] === 'object') {
            schema[i] = renameFormat(schema[i]);
        }
    }
    return schema;
}

module.exports = MigrateProcesses;