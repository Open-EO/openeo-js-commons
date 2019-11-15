var ajv;
try {
	ajv = require('ajv');
} catch(err) {}
const Utils = require('../utils');

module.exports = class JsonSchemaValidator {

	constructor() {
		this.typeHints = {
			'band-name': {type: 'string', validate: 'validateBandName'},
			'bounding-box': {type: 'object', validate: 'validateBoundingBox'},
			'callback': {type: 'object', validate: 'validateCallback'},
			'collection-id': {type: 'string', validate: 'validateCollectionId'},
			'epsg-code': {type: 'integer', validate: 'validateEpsgCode'},
			'geojson': {type: 'object', validate: 'validateGeoJson'},
			'job-id': {type: 'string', validate: 'validateJobId'},
			'kernel': {type: 'array', validate: 'validateKernel'},
			'output-format': {type: 'string', validate: 'validateOutputFormat'},
			'output-format-options': {type: 'object', validate: 'validateOutputFormatOptions'},
			'process-graph-id': {type: 'string', validate: 'validateProcessGraphId'},
			'process-graph-variables': {type: 'object', validate: 'validateProcessGraphVariables'},
			'proj-definition': {type: 'string', validate: 'validateProjDefinition'}, // Proj is deprecated. Implement projjson and wkt2 instead
			'raster-cube': {type: 'object', validate: 'validateRasterCube'},
			'temporal-interval': {type: 'array', validate: 'validateTemporalInterval'},
			'temporal-intervals': {type: 'array', validate: 'validateTemporalIntervals'},
			'vector-cube': {type: 'object', validate: 'validateVectorCube'}
		};
		var ajvOptions = {
			schemaId: 'auto',
			format: 'full',
			unknownFormats: Object.keys(this.typeHints)
		};
		if (!ajv) {
			throw "ajv not installed";
		}
		this.ajv = new ajv(ajvOptions);
		this.ajv.addKeyword('parameters', {
			dependencies: [
				"type",
				"format"
			],
			metaSchema: {
				type: "object",
				additionalProperties: {
					type: "object"
				}
			},
			valid: true,
			errors: true
		});
		this.ajv.addKeyword('typehint', {
			dependencies: [
				"type"
			],
			validate: async (typehint, data, schema) => {
				if (typeof this.typeHints[typehint] === 'object') {
					var th = this.typeHints[typehint];
					if (th.type === schema.type || (Array.isArray(schema.type) && schema.type.includes(th.type))) {
						return await this[th.validate](data);
					}
				}
				return false;
			},
			async: true,
			errors: true
		});

		this.outputFormats = null;
		this.geoJsonValidator = null;
	}

	/* This is a temporary workaround for the following issues:
		- https://github.com/epoberezkin/ajv/issues/1039
		- https://github.com/Open-EO/openeo-processes/issues/67 
		Once one of the issues is solved, fixSchema can be removed.
	*/
	fixSchemaFormat(s) {
		for(var i in s) {
			if (i === 'format' && typeof s[i] === 'string' && Object.keys(this.typeHints).includes(s[i])) {
				s.typehint = s[i];
			}
			if (s[i] && typeof s[i] === 'object') {
				s[i] = this.fixSchemaFormat(s[i]);
			}
		}
		return s;
	}

	fixSchema(s) {
		s = JSON.parse(JSON.stringify(s));

		// Set applicable JSON Schema draft version if not already set
		if (typeof s.$schema === 'undefined') {
			s.$schema = "http://json-schema.org/draft-07/schema#";
		}

		// format => typehint (see above)
		s = this.fixSchemaFormat(s);

		return s;
	}

	async validateJson(json, schema) {
		schema = this.fixSchema(schema);
		schema.$async = true;

		try {
			await this.ajv.validate(schema, json);
			return [];
		} catch (e) {
			if (Array.isArray(e.errors)) {
				return e.errors.map(e => e.message);
			}
			else {
				throw e;
			}
		}
	}

	validateJsonSchema(schema) {
		schema = JSON.parse(JSON.stringify(schema));
		schema = this.fixSchema(schema);
		let result = this.ajv.compile(schema);
		return result.errors || [];
	}

	// Pass the content of https://geojson.org/schema/GeoJSON.json
	setGeoJsonSchema(schema) {
		var gjv = new ajv();
		this.geoJsonValidator = gjv.compile(schema);
	}

	// Expects API compatible output formats (see GET /output_formats).
	setOutputFormats(outputFormats) {
		this.outputFormats = {};
		for (var key in outputFormats) {
			this.outputFormats[key.toUpperCase()] = outputFormats[key];
		}
	}

	/* istanbul ignore next */
	async validateBandName(/*data*/) {
		// Can't validate band name without knowing/loading the data.
		// => To be overridden by end-user application.
		return true;
	}

	/* istanbul ignore next */
	async validateBoundingBox(/*data*/) {
		// Nothing to validate, schema is (usually) delivered by processes.
		return true;
	}

	/* istanbul ignore next */
	async validateCallback(/*data*/) {
		// This should be checked by process graph parsing automatically.
		// Otherwise to be overridden by end-user application.
		return true;
	}

	/* istanbul ignore next */
	async validateCollectionId(/*data*/) {
		// To be overridden by end-user application.
		return true;
	}

	async validateEpsgCode(data) {
		// Rough check for valid numbers as we don't want to maintain a full epsg code list in this repo.
		// Fully validation to be implemented by end-user application by overriding this method.
		if (data >= 2000) {
			return true;
		}
		
		throw new ajv.ValidationError([{
			message: "Invalid EPSG code specified."
		}]);
	}

	// A very rough GeoJSON validation if no GeoJSON schema is available.
	validateGeoJsonSimple(data) {
		if (!Utils.isObject(data)) {
			throw new ajv.ValidationError([{
				message: "Invalid GeoJSON specified (not an object)."
			}]);
		}
		else if (typeof data.type !== 'string') {
			throw new ajv.ValidationError([{
				message: "Invalid GeoJSON specified (no type property)."
			}]);
		}

		switch(data.type) {
			case "Point":
			case "MultiPoint":
			case "LineString":
			case "MultiLineString":
			case "Polygon":
			case "MultiPolygon":
				if (!Array.isArray(data.coordinates)) {
					throw new ajv.ValidationError([{
						message: "Invalid GeoJSON specified (Geometry has no valid coordinates member)."
					}]);
				}
				return true;
			case "GeometryCollection":
				if (!Array.isArray(data.geometries)) {
					throw new ajv.ValidationError([{
						message: "Invalid GeoJSON specified (GeometryCollection has no valid geometries member)."
					}]);
				}
				return true;
			case "Feature":
				if (data.geometry !== null && !Utils.isObject(data.geometry)) {
					throw new ajv.ValidationError([{
						message: "Invalid GeoJSON specified (Feature has no valid geometry member)."
					}]);
				}
				if (data.properties !== null && !Utils.isObject(data.properties)) {
					throw new ajv.ValidationError([{
						message: "Invalid GeoJSON specified (Feature has no valid properties member)."
					}]);
				}
				return true;
			case "FeatureCollection":
				if (!Array.isArray(data.features)) {
					throw new ajv.ValidationError([{
						message: "Invalid GeoJSON specified (FeatureCollection has no valid features member)."
					}]);
				}
				return true;
			default:
				throw new ajv.ValidationError([{
					message: "Invalid GeoJSON type specified."
				}]);
		}
	}

	async validateGeoJson(data) {
		if (this.geoJsonValidator !== null) {
			if (!this.geoJsonValidator(data)) {
				throw new ajv.ValidationError(this.geoJsonValidator.errors);
			}
			return true;
		}
		else {
			return this.validateGeoJsonSimple(data);
		}
	}

	/* istanbul ignore next */
	async validateJobId(/*data*/) {
		// To be overridden by end-user application
		return true;
	}

	/* istanbul ignore next */
	async validateKernel(/*data*/) {
		// ToDo? / To be overridden by end-user application
		return true;
	}
	
	async validateOutputFormat(data) {
		if (Utils.isObject(this.outputFormats) && !(data.toUpperCase() in this.outputFormats)) {
			throw new ajv.ValidationError([{
				message: "Output format not supported."
			}]);
		}
		return true;
	}

	/* istanbul ignore next */
	async validateOutputFormatOptions(/*data*/) {
		// This depends on the output format specified and can't be fully validated without knowning the chosen output format.
		return true;
	}

	/* istanbul ignore next */
	async validateProcessGraphId(/*data*/) {
		// To be overridden by end-user application
		return true;
	}

	/* istanbul ignore next */
	async validateProcessGraphVariables(/*data*/) {
		// Nothing to validate against...
		return true;
	}

	async validateProjDefinition(data) {
		// To be overridden by end-user application, just doing a very basic check here.
		if (!data.toLowerCase().includes("+proj")) {
			throw new ajv.ValidationError([{
				message: "Invalid PROJ string specified (doesn't contain '+proj')."
			}]);
		}
		return true;
	}

	/* istanbul ignore next */
	async validateRasterCube(/*data*/) {
		// This is usually a reference to a process result as we haven't specified any JSON encoding for raster cubes.
		return true;
	}

	async validateTemporalInterval(/*data*/) {
		// ToDo: Fully check against schema, most is already checked by JSON Schemas itself, but check for example that 
		// both can't be null at the same time or the first element is > the second element.
		return true;
	}
	
	async validateTemporalIntervals(data) {
		var invalid = data.filter(x => !this.validateTemporalInterval(x));
		return invalid.length === 0;
	}

	/* istanbul ignore next */
	async validateVectorCube(/*data*/) {
		// This is usually a reference to a process result as we haven't specified any JSON encoding for raster cubes.
		return true;
	}

	// Checks whether the valueSchema is compatible to the paramSchema.
	// So would a value compatible with valueSchema be accepted by paramSchema?
	// allowValueAsElements: If true, it checks whether the valueSchema would be allowed as part of an array or object. For example number could be allowed as part of an array of numbers.
	static isSchemaCompatible(paramSchema, valueSchema, strict = false, allowValueAsElements = false) {
		var paramSchemas = this._convertSchemaToArray(paramSchema);
		var valueSchemas = this._convertSchemaToArray(valueSchema);

		var compatible = paramSchemas.filter(ps => {
			for(var i in valueSchemas) {
				var vs = valueSchemas[i];
				if (typeof ps.type !== 'string' || (!strict && typeof vs.type !== 'string')) { // "any" type is always compatible
					return true;
				}
				else if (ps.type === vs.type || (allowValueAsElements && (ps.type === 'array' || ps.type === 'object')) || (ps.type === 'number' && vs.type === 'integer') || (!strict && ps.type === 'integer' && vs.type === 'number')) {
					if (ps.type === 'array' && Utils.isObject(ps.items) && Utils.isObject(vs.items))  {
						if (allowValueAsElements && JsonSchemaValidator.isSchemaCompatible(ps.items, vs, strict)) {
							return true;
						}
						else if (JsonSchemaValidator.isSchemaCompatible(ps.items, vs.items, strict)) {
							return true;
						}
					}
					else if (ps.type === 'object' && Utils.isObject(ps.properties) && Utils.isObject(vs.properties)) {
						// ToDo: Check properties, required properties etc.
						// If allowValueAsElements is true, all types are allowed to be part of the object.
						return true;
					}
					else if (!strict && (typeof ps.format !== 'string' || typeof vs.format !== 'string')) {
						return true;
					}
					else if (typeof ps.format !== 'string') { // types without format always accepts the same type with a format
						return true;
					}
					else if (ps.format === vs.format) {
						return true;
					}
				}
			}
			return false;
		});

		return compatible.length > 0;
	}

	static _convertSchemaToArray(schema) {
		var schemas = [];
		// ToDo: schema.not and schema.allOf is not supported - see also class constructor of ProcessSchema in processSchema.js of openeo-web-editor.
		if (schema.oneOf || schema.anyOf) {
			schemas = (schema.oneOf || schema.anyOf);
		}
		else if (Array.isArray(schema.type)) {
			schemas = schema.type.map(t => Object.assign({}, schema, {type: t}));
		}
		else {
			schemas = [schema];
		}
		return schemas;
	}

	/**
	 * Returns the indices of provided JSON Schemas that the provided values matches against.
	 * 
	 * Returns a single index if a single type is mathcing.
	 * Returns undefined if no valid type is found.
	 * Returns an array of indices if multiple types are found.
	 * 
	 * @param {Array} types - Array of JSON schemas
	 * @param {*} value - A value
	 * @return {(string[]|string|undefined)} - Returns matching indices, see description.
	 */
	static async getTypeForValue(types, value) {
		var validator = new JsonSchemaValidator();
		var potentialTypes = [];
		for(var i in types) {
			var errors = await validator.validateJson(value, types[i]);
			if (errors.length === 0) {
				potentialTypes.push(String(i));
			}
		}
		return potentialTypes.length > 1 ? potentialTypes : potentialTypes[0];
	}

};