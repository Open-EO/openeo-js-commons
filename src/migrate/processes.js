const Utils = require('../utils.js');
const Versions = require('../versions.js');

class MigrateProcesses {

    // Always returns a copy of the input process object
    static convertProcessToLatestSpec(originalProcess, version) {
        if (Versions.compare(version, "0.3.x", "<=")) {
            throw "Migrating from API version 0.3.0 and older is not supported.";
        }

        // Make sure we don't alter the original object
        let process = Utils.deepClone(originalProcess);

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
            for(let i in process.parameters) {
                let param = process.parameters[i];
                if (!Utils.isObject(param)) {
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