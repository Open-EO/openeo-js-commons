const ProcessUtils = require('../src/processUtils.js');

describe('ProcessProcessUtils Tests', () => {

	test('normalizeJsonSchema', () => {
		expect(ProcessUtils.normalizeJsonSchema(null)).toEqual([]);
		expect(ProcessUtils.normalizeJsonSchema({})).toEqual([{}]);

		expect(ProcessUtils.normalizeJsonSchema({
			type: "string"
		})).toEqual([{
			type: "string"
		}]);

		expect(ProcessUtils.normalizeJsonSchema([{
			type: ["string", "null"],
			pattern: "^\w+$"
		}, {
			type: "boolean"
		}], true)).toEqual([{
			type: "string",
			pattern: "^\w+$"
		},{
			type: "null",
			pattern: "^\w+$"
		},{
			type: "boolean"
		}]);

		expect(ProcessUtils.normalizeJsonSchema({
			type: "string",
			anyOf: [
				{format: "url"},
				{format: "path"}
			]
		})).toEqual([{
			type: "string",
			format: "url"
		},{
			type: "string",
			format: "path"
		}]);

		expect(ProcessUtils.normalizeJsonSchema({
			oneOf: [
				{
					type: "string",
					format: "url"
				},
				{
					type: "string",
					format: "path"
				}
			]
		})).toEqual([{
			type: "string",
			format: "url"
		},{
			type: "string",
			format: "path"
		}]);

		expect(ProcessUtils.normalizeJsonSchema({
			allOf: [
				{type: "string",},
				{format: "path"}
			]
		})).toEqual([{
			type: "string",
			format: "path"
		}]);

		let normal = [{
			type: "string"
		},{
			type: "null"
		}];
		expect(ProcessUtils.normalizeJsonSchema(normal)).toEqual(normal);
	});

	test('getNativeTypesForJsonSchema', () => {
		expect(ProcessUtils.getNativeTypesForJsonSchema(null)).toEqual(ProcessUtils.JSON_SCHEMA_TYPES);

		expect(ProcessUtils.getNativeTypesForJsonSchema({}, false)).toEqual(ProcessUtils.JSON_SCHEMA_TYPES);
		expect(ProcessUtils.getNativeTypesForJsonSchema({}, true)).toEqual([]);
		expect(ProcessUtils.getNativeTypesForJsonSchema({type: ProcessUtils.JSON_SCHEMA_TYPES}, false)).toEqual(ProcessUtils.JSON_SCHEMA_TYPES);
		expect(ProcessUtils.getNativeTypesForJsonSchema({type: ProcessUtils.JSON_SCHEMA_TYPES}, true)).toEqual([]);
	
		expect(ProcessUtils.getNativeTypesForJsonSchema({
			type: ["boolean", "boolean"]
		})).toEqual(["boolean"]);
		expect(ProcessUtils.getNativeTypesForJsonSchema({
			type: ["boolean", "boolean", "boolean", "boolean", "boolean", "boolean", "boolean"]
		}, true)).toEqual(["boolean"]);

		expect(ProcessUtils.getNativeTypesForJsonSchema({
			type: "string"
		})).toEqual(["string"]);
		expect(ProcessUtils.getNativeTypesForJsonSchema({
			type: ["boolean", "null"]
		})).toEqual(["boolean", "null"]);

		expect(ProcessUtils.getNativeTypesForJsonSchema({
			type: null
		}, true)).toEqual([]);
	});

	test('getElementJsonSchema', () => {
		expect(ProcessUtils.getElementJsonSchema(null)).toEqual({});
		expect(ProcessUtils.getElementJsonSchema({})).toEqual({});

		expect(ProcessUtils.getElementJsonSchema({
			type: "array"
		})).toEqual({});
		expect(ProcessUtils.getElementJsonSchema({
			type: "object"
		})).toEqual({});

		// Arrays
		expect(ProcessUtils.getElementJsonSchema({
			type: "array",
			items: {type: "string"}
		})).toEqual({type: "string"});

		expect(ProcessUtils.getElementJsonSchema({
			type: "array",
			items: [
				{type: "string"},
				{type: "number"}
			]
		})).toEqual({});

		expect(ProcessUtils.getElementJsonSchema({
			type: "array",
			items: [
				{type: "string"},
				{type: "number"}
			]
		}, 0)).toEqual({type: "string"});

		expect(ProcessUtils.getElementJsonSchema({
			type: "array",
			items: [
				{type: "string"},
				{type: "number"}
			]
		}, 1)).toEqual({type: "number"});

		expect(ProcessUtils.getElementJsonSchema({
			type: "array",
			items: [
				{type: "string"},
				{type: "number"}
			]
		}, 2)).toEqual({});

		expect(ProcessUtils.getElementJsonSchema({
			type: "array",
			items: [
				{type: "string"},
				{type: "number"}
			],
			additionalItems: {type: "boolean"}
		}, 2)).toEqual({type: "boolean"});

		expect(ProcessUtils.getElementJsonSchema({
			type: "array",
			additionalItems: {type: "boolean"}
		}, "asdf")).toEqual({});

		// Objects
		let s1 = {
			type: "object",
			additionalProperties: {type: "string"}
		};
		expect(ProcessUtils.getElementJsonSchema(s1)).toEqual({type: "string"});
		expect(ProcessUtils.getElementJsonSchema(s1, "asdf")).toEqual({type: "string"});

		let s2 = {
			type: "object",
			properties: {
				key1: {type: "string"},
				key2: {type: "number"}
			},
			additionalProperties: {type: "boolean"}
		};
		expect(ProcessUtils.getElementJsonSchema(s2)).toEqual({type: "boolean"});
		expect(ProcessUtils.getElementJsonSchema(s2, "key1")).toEqual({type: "string"});
		expect(ProcessUtils.getElementJsonSchema(s2, "key2")).toEqual({type: "number"});
		expect(ProcessUtils.getElementJsonSchema(s2, "key3")).toEqual({type: "boolean"});
	});

	let cbParams = [
		{
			name: "data",
			schema: {
				type: "array"
			}
		},
		{
			name: "context",
			schema: {
				description: "Any data type."
			}
		}
	];
	let schema = {
		type: "object",
		subtype: "process-graph",
		parameters: cbParams
	};
	let param = {
		name: "reducer",
		schema: schema
	};
	let process = {
		id: "reduce",
		parameters: [
			param,
			{
				name: "context",
				schema: {}
			}
		]
	};
	test('getCallbackParametersForProcess', () => {
		expect(ProcessUtils.getCallbackParametersForProcess(null)).toEqual([]);
		expect(ProcessUtils.getCallbackParametersForProcess({}, "reducer")).toEqual([]);
		expect(ProcessUtils.getCallbackParametersForProcess({parameters: {}}, "reducer")).toEqual([]);
		expect(ProcessUtils.getCallbackParametersForProcess({parameters: []}, "reducer")).toEqual([]);

		expect(ProcessUtils.getCallbackParametersForProcess(process, "invalid")).toEqual([]);
		expect(ProcessUtils.getCallbackParametersForProcess(process, "reducer")).toEqual(cbParams);

		// All other tests are handled by getCallbackParameters
	});
	test('getCallbackParameters', () => {
		expect(ProcessUtils.getCallbackParameters(null)).toEqual([]);
		expect(ProcessUtils.getCallbackParameters({})).toEqual([]);

		expect(ProcessUtils.getCallbackParameters(param)).toEqual(cbParams);
		expect(ProcessUtils.getCallbackParameters(param)).toEqual(cbParams);

		expect(ProcessUtils.getCallbackParameters({
			name: "reducer",
			schema: [
				schema,
				schema
			]
		})).toEqual(cbParams);

		expect(ProcessUtils.getCallbackParameters({
			name: "reducer",
			schema: [
				schema,
				{
					parameters: null
				}
			]
		})).toEqual(cbParams);

		expect(() => ProcessUtils.getCallbackParameters({
			name: "reducer",
			schema: [
				schema,
				{
					type: "object",
					parameters: [
						{
							name: "x",
							schema: {
								type: "string"
							}
						}
					]
				}
			]
		})).toThrow();

		let lcParams = [
			{
				"name": "value",
				"description": "The property value to be checked against.",
				"schema": {
					"description": "Any data type."
				}
			}
		];
		let lc = {
			"name": "properties",
			"description": "",
			"schema": [
				{
					"type": "object",
					"subtype": "metadata-filter",
					"description": "",
					"additionalProperties": {
						"type": "object",
						"subtype": "process-graph",
						"parameters": lcParams
					}
				},
				{
					"title": "No filter",
					"description": "Don't filter by metadata properties.",
					"type": "null"
				}
			]
		};
		expect(ProcessUtils.getCallbackParameters(lc, ['eo:cloud_cover'])).toEqual(lcParams);
	});


});