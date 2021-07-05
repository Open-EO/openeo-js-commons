const ProcessUtils = require('./processUtils');
const ProcessDataType = require('./processDataType');
const Utils = require('./utils');

/**
 * Wrapper class for the process schemas (i.e. from parameters or return value).
 * 
 * @class
 */
class ProcessSchema {
	
	/**
	 * Constructs a new process schema based on the openEO API representation.
	 * 
	 * Can be array or JSON Schema object. The array consists of multiple JSON Schemas then.
	 * 
	 * @param {?object|array} [schema=null]
	 * @param {*} [defaultValue=undefined]
	 */
	constructor(schema = null, defaultValue = undefined) {
		if (!Utils.isObject(schema) && !Array.isArray(schema)) {
			this.unspecified = true;
			this.schemas = [];
		}
		else {
			this.unspecified = false;
			this.schemas = ProcessUtils.normalizeJsonSchema(schema, true).map(s => new ProcessDataType(s, this, defaultValue));

			// Find and assign the default value from sub-schemas if no defaultValue was given
			if (typeof defaultValue === 'undefined') {
				let defaults = this.schemas
					.map(s => s.default())
					.filter(d => typeof d !== 'undefined');
				this.default = defaults[0];
			}
			else {
				this.default = defaultValue;
			}
		}

		this.refs = [];
	}

	/**
	 * Converts the schemas to a JSON-serializable representation.
	 * 
	 * @returns {object}
	 */
	toJSON() {
		return this.schemas.map(s => s.toJSON());
	}

	/**
	 * Returns whether the schema is editable.
	 * 
	 * This means it returns `true`, unless certain data types are detected that
	 * can't be transmitted via JSON in the openEO API (e.g. data cubes or labeled arrays).
	 * 
	 * @returns {boolean}
	 */
	isEditable() {
		return (this.unspecified || this.schemas.filter(s => s.isEditable() && !s.isNull()).length > 0);
	}

	/**
	 * Checks whether the schema is exactly and only of the given data type.
	 * 
	 * Can be a native type or a openEO "subtype".
	 * 
	 * @param {string} type 
	 * @returns {boolean}
	 */
	is(type) {
		var types = this.dataTypes();
		return (types.length === 1 && types[0] === type);
	}

	/**
	 * Returns the native data type of the schema.
	 * 
	 * One of: array, object, null, string, boolean, number
	 * 
	 * @returns {string}
	 */
	nativeDataType() {
		return this.dataType(true);
	}

	/**
	 * Returns the data type of the associated schemas.
	 * 
	 * Setting `native` to `true` will only consider native JSON data types and "any".
	 * Otherwise, subtypes will also be considered.
	 * 
	 * If the schema has a two data types and one of them is `null`, 
	 * `null` is ignored and just the other data type is returned.
	 * 
	 * `nullable()` can be used to check whether a schema allows `null`.
	 * 
	 * Returns `mixed` if multiple data types are allowed.
	 * 
	 * @param {boolean} [native=false]
	 * @returns {string}
	 * @see ProcessSchema#nullable
	 */
	dataType(native = false) {
		var types = this.dataTypes(true, native);
		var nullIndex = types.indexOf('null');
		if (types.length === 1) {
			return types[0];
		}
		else if (types.length === 2 && nullIndex !== -1) {
			return types[nullIndex === 0 ? 1 : 0];
		}
		else {
			return 'mixed';
		}
	}

	/**
	 * Returns a set of all supported distinct data types (or 'any').
	 * 
	 * By default, `null` is not included in the list of data types.
	 * Setting `includeNull` to `true` to include `null` in the list.
	 * 
	 * Setting `native` to `true` will only consider native JSON data types and "any".
	 * Otherwise, subtypes will also be considered.
	 * 
	 * @param {boolean} [includeNull=false]
	 * @param {boolean} [native=false]
	 * @returns {array<string>}
	 */
	dataTypes(includeNull = false, native = false) {
		var types = this.schemas
			.map(s => s.dataType(native))
			.filter((v, i, a) => a.indexOf(v) === i); // Return each type only once
		if (types.length === 0 || types.includes('any')) {
			return ['any'];
		}
		return includeNull ? types : types.filter(s => s !== 'null');
	}

	/**
	 * Checks whether one of the schemas allows the value to be `null`.
	 * 
	 * @returns {boolean}
	 */
	nullable() {
		return (this.unspecified || this.schemas.filter(s => s.nullable()).length > 0);
	}

}

module.exports = ProcessSchema;