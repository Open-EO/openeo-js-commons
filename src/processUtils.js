const Utils = require('./utils');

/**
 * Utilities to parse process specs and JSON schemas.
 * 
 * @class
 */
class ProcessUtils {

	/**
	 * From a "complex" JSON Schema with allOf/anyOf/oneOf, make separate schemas.
	 * 
	 * So afterwards each schema has it's own array entry.
	 * It merges allOf, resolves anyOf/oneOf into separate schemas.
	 * May also split the JSON Schema type arrays into separate entries by setting `splitTypes` to `true`.
	 * 
	 * @param {object|array} schemas - The JSON Schema(s) to convert
	 * @returns {array}
	 */
	static normalizeJsonSchema(schemas, splitTypes = false) {
		// Make schemas always an array
		if (Utils.isObject(schemas)) {
			schemas = [schemas];
		}
		else if (Array.isArray(schemas)) {
			schemas = schemas;
		}
		else {
			schemas = [];
		}

		// Merge allOf, resolve anyOf/oneOf into separate schemas
		let normalized = [];
		for(let schema of schemas) {
			if (Array.isArray(schema.allOf)) {
				normalized.push(Object.assign({}, ...schema.allOf));
			}
			else if (Array.isArray(schema.oneOf) || Array.isArray(schema.anyOf)) {
				let copy = Utils.omitFromObject(schema, ['oneOf', 'anyOf']);
				let subSchemas = schema.oneOf || schema.anyOf;
				for(let subSchema of subSchemas) {
					normalized.push(Object.assign({}, copy, subSchema));
				}
			}
			else {
				normalized.push(schema);
			}
		}

		if (!splitTypes) {
			return normalized;
		}

		// Split type field into separate schemas
		schemas = [];
		for(let schema of normalized) {
			if (Array.isArray(schema.type)) {
				/* jshint ignore:start */
				schemas = schemas.concat(schema.type.map(type => Object.assign({}, schema, {type: type})));
				/* jshint ignore:end */
			}
			else {
				schemas.push(schema);
			}
		}

		return schemas;
	}

	/**
	 * Returns the callback parameters for a given process parameter.
	 * 
	 * @param {object} processParameter - The process parameter spec to parse.
	 * @returns {array}
	 * @throws {Error}
	 */
	static getCallbackParameters(processParameter, keyPath = []) {
		if (!Utils.isObject(processParameter) || !processParameter.schema) {
			return [];
		}

		let schemas = ProcessUtils.normalizeJsonSchema(processParameter.schema);
		let key;
		while(key = keyPath.shift()) { // jshint ignore:line
			schemas = schemas.map(schema => ProcessUtils.normalizeJsonSchema(ProcessUtils.getElementJsonSchema(schema, key))); // jshint ignore:line
			schemas = schemas.concat(...schemas);
		}


		let cbParams = [];
		for(let schema of schemas) {
			let params = null;
			if (Array.isArray(schema.parameters)) { // For "normal" callbacks
				params = schema.parameters;
			}
			else if (Utils.isObject(schema.additionalProperties) && Array.isArray(schema.additionalProperties.parameters)) {
				params = schema.additionalProperties.parameters; // Used for metadata-filter
			}
			if (Array.isArray(params)) {
				if (cbParams.length > 0 && !Utils.equals(cbParams, params)) {
					throw new Error("Multiple schemas with different callback parameters found.");
				}
				cbParams = params;
			}
		}

		return cbParams;
	}

	/**
	 * Returns the callback parameters for a given process parameter from a full process spec.
	 * 
	 * @param {object} process - The process to parse.
	 * @param {string} parameterName - The name of the parameter to get the callback parameters for.
	 * @returns {array}
	 * @throws {Error}
	 */
	static getCallbackParametersForProcess(process, parameterName, path = []) {
		if (!Utils.isObject(process) || !Array.isArray(process.parameters)) {
			return [];
		}

		let param = process.parameters.find(p => p.name === parameterName);
		return ProcessUtils.getCallbackParameters(param, path);
	}

	/**
	 * Returns *all* the native JSON data types allowed for the schema.
	 * 
	 * @param {object} schema 
	 * @param {boolean} anyIsEmpty
	 * @returns {array}
	 */
	static getNativeTypesForJsonSchema(schema, anyIsEmpty = false) {
		if (Utils.isObject(schema) && Array.isArray(schema.type)) {
			// Remove duplicate and invalid types
			let validTypes = Utils.unique(schema.type).filter(type => ProcessUtils.JSON_SCHEMA_TYPES.includes(type));
			if (validTypes.length > 0 && validTypes.length < ProcessUtils.JSON_SCHEMA_TYPES.length) {
				return validTypes;
			}
			else {
				return anyIsEmpty ? [] : ProcessUtils.JSON_SCHEMA_TYPES;
			}
		}
		else if (Utils.isObject(schema) && typeof schema.type === 'string' && ProcessUtils.JSON_SCHEMA_TYPES.includes(schema.type)) {
			return [schema.type];
		}
		else {
			return anyIsEmpty ? [] : ProcessUtils.JSON_SCHEMA_TYPES;
		}
	}

	/**
	 * Returns the schema for a property of an object or an element of an array.
	 * 
	 * If you want to retrieve the schema for a specific key, use the parameter `key`.
	 * 
	 * @param {object} schema - The JSON schema to parse.
	 * @param {string|integer|null} key - If you want to retrieve the schema for a specific key, otherwise null.
	 * @returns {object} - JSON Schema
	 */
	static getElementJsonSchema(schema, key = null) {
		let types = ProcessUtils.getNativeTypesForJsonSchema(schema);
		if (Utils.isObject(schema) && types.includes('array') && typeof key !== 'string') {
			if (Utils.isObject(schema.items)) {
				// Array with one schema for all items: https://json-schema.org/understanding-json-schema/reference/array.html#id5
				return schema.items;
			}
			else if (Array.isArray(schema.items)) {
				// Tuple validation: https://json-schema.org/understanding-json-schema/reference/array.html#id6
				if (key !== null && Utils.isObject(schema.items[key])) {
					return schema.items[key];
				}
				else if (Utils.isObject(schema.additionalItems)) {
					return schema.additionalItems;
				}
			}
		}
		if (Utils.isObject(schema) && types.includes('object')) {
			if (key !== null && Utils.isObject(schema.properties) && Utils.isObject(schema.properties[key])) {
				return schema.properties[key];
			}
			else if (Utils.isObject(schema.additionalProperties)) {
				return schema.additionalProperties;
			}
			// ToDo: No support for patternProperties yet
		}

		return {};
	}

}

/**
 * A list of all allowed JSON Schema type values.
 * 
 * @type {array}
 */
ProcessUtils.JSON_SCHEMA_TYPES = ['string', 'number', 'integer', 'boolean', 'array', 'object', 'null'];

module.exports = ProcessUtils;