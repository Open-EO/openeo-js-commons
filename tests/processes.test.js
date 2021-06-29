const ProcessParameter = require('../src/processParameter');
const ProcessSchema = require('../src/processSchema');
const ProcessDataType = require('../src/processDataType');
const { array } = require('yargs');

describe('Process(Parameter|Schema|DataType) Tests', () => {

	test('ProcessParameter', () => {
		let parameter = {
			name: 'example',
			optional: true,
			default: "2020-01-01",
			schema: {
				type: 'string',
				subtype: 'date'
			}
		};

		let obj = new ProcessParameter(parameter);
		expect(obj.name).toBe(parameter.name);
		expect(obj.optional).toBe(parameter.optional);
		expect(obj.default).toBe(parameter.default);
		expect(obj.schema).toEqual(parameter.schema);

		expect(obj.toJSON()).toEqual([parameter.schema]);
		expect(obj.isEditable()).toBe(true);
		expect(obj.is('date')).toBe(true);
		expect(obj.nativeDataType()).toBe('string');
		expect(obj.dataType()).toBe('date');
		expect(obj.dataTypes()).toEqual(['date']);
		expect(obj.nullable()).toBe(false);

	});

	test('ProcessSchema (empty)', () => {
		let obj = new ProcessSchema();

		expect(obj.unspecified).toBe(true);
		expect(obj.schemas).toEqual([]);
		expect(obj.default).toBeUndefined();

		expect(obj.toJSON()).toEqual([]);
		expect(obj.isEditable()).toBe(true);
		expect(obj.is('null')).toBe(false);
		expect(obj.nativeDataType()).toBe('any');
		expect(obj.dataType()).toBe('any');
		expect(obj.dataTypes()).toEqual(['any']);
		expect(obj.nullable()).toBe(true);

	});

	test('ProcessSchema (array)', () => {
		let schemas = [
			{
				type: 'string',
				subtype: 'date-time'
			},
			{
				type: 'string',
				subtype: 'date'
			},
			{
				type: 'number',
				default: 0
			}
		];

		let obj = new ProcessSchema(schemas);
		expect(obj.unspecified).toBe(false);
		expect(obj.default).toBe(0);

		expect(obj.toJSON()).toEqual(schemas);
		expect(obj.isEditable()).toBe(true);
		expect(obj.is('date-time')).toBe(false);
		expect(obj.is('date')).toBe(false);
		expect(obj.nativeDataType()).toBe('mixed');
		expect(obj.dataType()).toBe('mixed');
		expect(obj.dataTypes()).toEqual(['date-time', 'date', 'number']);
		expect(obj.dataTypes(false, true)).toEqual(['string', 'number']);
		expect(obj.nullable()).toBe(false);
	});

	test('ProcessSchema (object)', () => {
		let defaultValue = null;
		let schemas = {
			type: ['number', 'null']
		};
		let normalizedSchema = [
			{
				type: 'number',
				default: defaultValue
			},
			{
				type: 'null',
				default: defaultValue
			}
		];

		let obj = new ProcessSchema(schemas, defaultValue);
		expect(obj.unspecified).toBe(false);
		expect(obj.default).toBe(defaultValue);

		expect(obj.toJSON()).toEqual(normalizedSchema);
		expect(obj.isEditable()).toBe(true);
		expect(obj.is('number')).toBe(true);
		expect(obj.is('null')).toBe(false);
		expect(obj.nativeDataType()).toBe('number');
		expect(obj.dataType()).toBe('number');
		expect(obj.dataTypes(true)).toEqual(['number', 'null']);
		expect(obj.dataTypes()).toEqual(['number']);
		expect(obj.nullable()).toBe(true);
	});

	test('ProcessSchema (ignore schema default)', () => {
		let schema = {
			type: 'boolean',
			default: false
		};

		let obj = new ProcessSchema(schema, true);
		expect(obj.default).toBe(true);
	});

	test('ProcessDataType (enums)', () => {
		let type = 'string';
		let title = 'abc';
		let description = 'A, B or C?';
		let _enum = [
			'A',
			'B',
			'C'
		];
		let schema = {
			type,
			title,
			description,
			enum: _enum
		};

		let obj = new ProcessDataType(schema);

		expect(ProcessDataType.DEFAULT_GROUP).toBe('Other');

		expect(obj.schema).toEqual(schema);

		expect(obj.toJSON()).toEqual(schema);
		expect(obj.isAny()).toBe(false);
		expect(obj.isNull()).toBe(false);
		expect(obj.nullable()).toBe(false);
		expect(obj.isEditable()).toBe(true);
		expect(obj.dataType()).toBe(type);
		expect(obj.nativeDataType()).toBe(type);
		expect(obj.isEnum()).toBe(true);
		expect(obj.getEnumChoices()).toEqual(_enum);
		expect(obj.getCallbackParameters()).toEqual([]);
		expect(obj.group()).toBe(ProcessDataType.DEFAULT_GROUP);
		expect(obj.title()).toBe(title);
		expect(obj.description()).toBe(description);
		expect(obj.default()).toBeUndefined();
	});

	test('ProcessDataType (process-graph)', () => {
		let type = 'object';
		let subtype = 'process-graph';
		let group = 'openEO';
		let parameters = [
			{
				name: 'x',
				description: 'A value.',
				schema: {
					type: 'number'
				}
			}
		];
		let _default = null;
		let schema = {
			type,
			subtype,
			group,
			parameters,
			default: _default
		};

		let obj = new ProcessDataType(schema);
		expect(obj.schema).toEqual(schema);

		expect(obj.toJSON()).toEqual(schema);
		expect(obj.isAny()).toBe(false);
		expect(obj.isNull()).toBe(false);
		expect(obj.nullable()).toBe(false);
		expect(obj.isEditable()).toBe(true);
		expect(obj.dataType()).toBe(subtype);
		expect(obj.nativeDataType()).toBe(type);
		expect(obj.isEnum()).toBe(false);
		expect(obj.getEnumChoices()).toEqual([]);
		expect(obj.getCallbackParameters()).toEqual(parameters);
		expect(obj.group()).toBe(group);
		expect(obj.title()).toBe("Process Graph");
		expect(obj.description()).toBe("");
		expect(obj.default()).toBe(_default);
	});

	test('ProcessDataType (any)', () => {
		let obj = new ProcessDataType({}, null, {});
		expect(obj.toJSON()).toEqual({
			default: {}
		});
		expect(obj.isAny()).toBe(true);
		expect(obj.isNull()).toBe(false);
		expect(obj.nullable()).toBe(true);
		expect(obj.dataType()).toBe('any');
		expect(obj.nativeDataType()).toBe('any');
		expect(obj.default()).toEqual({});
		expect(obj.title()).toBe("Any");
	});

	test('ProcessDataType (raster-cube)', () => {
		let type = 'object';
		let subtype = 'raster-cube';
		let schema = {
			type,
			subtype,
			default() {
				return {}
			}
		};

		let obj = new ProcessDataType(schema);
		expect(obj.schema).toEqual(schema);
		
		expect(obj.toJSON()).toEqual({
			type,
			subtype,
			default: {}
		});
		expect(obj.isAny()).toBe(false);
		expect(obj.isNull()).toBe(false);
		expect(obj.nullable()).toBe(false);
		expect(obj.isEditable()).toBe(false);
		expect(obj.dataType()).toBe(subtype);
		expect(obj.default()).toEqual({});
		expect(obj.nativeDataType()).toBe(type);
	});

});