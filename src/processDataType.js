const Utils = require('./utils');

/**
 * Wrapper class for a single data type definition in a schema (e.g. process parameter schema, return value schema).
 * 
 * @class
 */
class ProcessDataType {
	
	/**
	 * Constructs a new process data type based on JSON Schema.
	 * 
	 * @param {object} schema
	 * @param {?ProcessSchema} [parent=null]
	 * @param {*} [defaultValue=undefined]
	 */
	constructor(schema, parent = null, defaultValue = undefined) {
		this.schema = schema;
		if (typeof this.schema.default === 'undefined') {
			this.schema.default = defaultValue;
		}
		this.parent = parent;
	}

	/**
	 * Converts the schema to a JSON-serializable representation.
	 * 
	 * @returns {object}
	 */
	toJSON() {
		return Object.assign({}, this.schema, {default: this.default()});
	}

	/**
	 * Checks whether the data type is only `null`.
	 * 
	 * @returns {boolean}
	 */
	isAny() {
		return this.dataType() === 'any';
	}

	/**
	 * Checks whether the data type is only `null`.
	 * 
	 * @returns {boolean}
	 */
	isNull() {
		return this.schema.type === 'null';
	}

	/**
	 * Checks whether the data type allows `null`.
	 * 
	 * @returns {boolean}
	 */
	nullable() {
		return this.isNull() || this.isAny();
	}

	/**
	 * Returns whether the data type is editable.
	 * 
	 * This means it returns `true`, unless certain data types are detected that
	 * can't be transmitted via JSON in the openEO API (e.g. data cubes or labeled arrays).
	 * 
	 * @returns {boolean}
	 */
	isEditable() {
		return !ProcessDataType.NON_EDITABLE.includes(this.dataType());
	}

	/**
	 * Returns the data type.
	 * 
	 * The priority is as such:
	 * - subtype
	 * - native data type
	 * - "any"
	 * 
	 * @param {boolean} [native=false] - Set to true to only return the native data type.
	 * @returns {string}
	 */
	dataType(native = false) {
		let nativeType = this.schema.type || "any";
		return native ? nativeType : (this.schema.subtype || nativeType);
	}

	/**
	 * Returns the native data type of the schema.
	 * 
	 * One of: array, object, null, string, boolean, number or any
	 * 
	 * @returns {string}
	 */
	nativeDataType() {
		return this.dataType(true);
	}

	/**
	 * Checks whether the data type contains an enumeration of values.
	 * 
	 * @returns {boolean}
	 * @see ProcessDataType#getEnumChoices
	 */
	isEnum() {
		return Array.isArray(this.schema.enum) && this.schema.enum.length > 0;
	}

	/**
	 * Returns the allowed enumeration of values.
	 * 
	 * @returns {array}
	 * @see ProcessDataType#isEnum
	 */
	getEnumChoices() {
		return this.isEnum() ? this.schema.enum : [];
	}

	/**
	 * Returns the parameters for a "child process" that is defined for the data type.
	 * 
	 * @returns {array<object>}
	 */
	getCallbackParameters() {
		if (Array.isArray(this.schema.parameters)) { // For "normal" callbacks
			return this.schema.parameters;
		}
		else if (Utils.isObject(this.schema.additionalProperties) && Array.isArray(this.schema.additionalProperties.parameters)) {
			return this.schema.additionalProperties.parameters; // Used for metadata-filter
		}
		else {
			return [];
		}
	}

	/**
	 * Returns the group of the data type.
	 * 
	 * Group is a "extension" of JSON Schema, which allows to group schemas by certain criteria.
	 * 
	 * @returns {string}
	 */
	group() {
		return Utils.hasText(this.schema.group) ? this.schema.group : ProcessDataType.DEFAULT_GROUP;
	}

	/**
	 * Returns the title of the data type.
	 * 
	 * If no title is present, returns a "prettified" version of the data type
	 * (e.g. "Temporal Interval" for the data type "temporal-interval").
	 * 
	 * @returns {string}
	 */
	title() {
		if (Utils.hasText(this.schema.title)) {
			return this.schema.title;
		}
		else {
			return Utils.prettifyString(this.dataType());
		}
	}

	/**
	 * Returns the description of the data type.
	 * 
	 * @returns {string}
	 */
	description() {
		return Utils.hasText(this.schema.description) ? this.schema.description : "";
	}

	/**
	 * Returns the default value of the data type.
	 * 
	 * This may return `undefined`.
	 * 
	 * @returns {*}
	 */
	default() {
		if (typeof this.schema.default === 'function') {
			return this.schema.default();
		}
		return this.schema.default;
	}

}

/**
 * The name of the default group for schemas.
 * 
 * Defaults to `Other`.
 * 
 * @type {string}
 */
ProcessDataType.DEFAULT_GROUP = 'Other';
/**
 * A list of data types that can't be edited.
 * 
 * Non-editable data types can't be transmitted via JSON through the openEO API
 * (e.g. data cubes or labeled arrays).
 * 
 * @type {array<string>}
 */
ProcessDataType.NON_EDITABLE = [
	'raster-cube',
	'vector-cube',
	'labeled-array',
	'datacube'
];

module.exports = ProcessDataType;