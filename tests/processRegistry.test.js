const PROCESSES = require('./processes.json');

const ProcessRegistry = require('../src/processRegistry');
const Utils = require('../src/utils');

describe('Registry Tests', () => {

	var registry;
	test('Initialize', () => {
		registry = new ProcessRegistry();
		expect(registry.count()).toBe(0);
		registry.addAll(PROCESSES);
		expect(registry.count()).toBe(PROCESSES.length);
	});

	test('Add invalid processes', () => {
		expect(() => registry.add(null)).toThrowError();
		expect(() => registry.add({description: "Test"})).toThrowError();
		expect(() => registry.add({id: 'test'}, null)).toThrowError();
		expect(registry.count()).toBe(PROCESSES.length);
	});

	const helloWorld = {id: 'hello_world', process_graph: {}};
	const custom = {id: 'custom', process_graph: {}};

	test('Add namespaced process individually', () => {
		registry.add(helloWorld, 'foobar');
		registry.add(custom, 'user');
		expect(registry.has('hello_world', 'foobar')).toBeTruthy();
		expect(registry.has('custom', 'user')).toBeTruthy();
	});

	test('Has process', () => {
		expect(registry.has(null)).toBeFalsy();
	
		expect(registry.has('absolute')).toBeTruthy();
		expect(registry.has('absolute', 'backend')).toBeTruthy();
		expect(registry.has("absolute", "user")).toBeFalsy();
		expect(registry.has("absolute", "foobar")).toBeFalsy();

		expect(registry.has("unknown-process")).toBeFalsy();
		expect(registry.has("unknown-process", "invalid")).toBeFalsy();

		expect(registry.has('custom')).toBeTruthy();
		expect(registry.has('custom', 'user')).toBeTruthy();
		expect(registry.has('custom', 'backend')).toBeFalsy();
		expect(registry.has('custom', 'foobar')).toBeFalsy();
		
		expect(registry.has('hello_world', 'foobar')).toBeTruthy();
	});

	test('Get process', () => {
		expect(registry.get(null)).toBeNull();

		var absolute = registry.get("absolute");
		expect(Utils.isObject(absolute)).toBeTruthy();
		expect(absolute.id).toBe("absolute");

		expect(registry.get("unknown-process")).toBeNull();
	});

	test('Get namespaced process', () => {
		var hw = registry.get('hello_world', 'foobar');
		expect(hw).toEqual(helloWorld);
	});

	test('Get namespace', () => {
		expect(registry.namespace(null)).toEqual([]);
		expect(registry.namespace('foobar')).toEqual([helloWorld]);
		expect(registry.namespace('user')).toEqual([custom]);
		expect(registry.namespace('invalid')).toEqual([]);
	});

	test('Get all processes', () => {
		expect(registry.all()).toEqual(PROCESSES.concat([helloWorld, custom]));
	});

	const customBackend = {id: 'custom', summary: 'A new backend process!', process_graph: {}};

	test('Add conflicting process between user and backend and retrieve user process', () => {
		registry.add(customBackend, 'backend');
		
		expect(registry.has('custom')).toBeTruthy();
		expect(registry.has('custom', 'user')).toBeTruthy();
		expect(registry.has('custom', 'backend')).toBeTruthy();
		expect(registry.has('custom', 'foobar')).toBeFalsy();

		var c = registry.get('custom');
		expect(c).toEqual(custom);
	});

	test('Has namespace', () => {
		expect(registry.hasNamespace(null)).toBeFalsy();
		expect(registry.hasNamespace('backend')).toBeTruthy();
		expect(registry.hasNamespace('user')).toBeTruthy();
		expect(registry.hasNamespace('invalid')).toBeFalsy();
	});

	test('Remove custom user process', () => {
		expect(registry.remove('invalid')).toBeFalsy();
		expect(registry.remove('custom')).toBeTruthy();

		var c = registry.get('custom');
		expect(c).toEqual(customBackend);

		expect(registry.remove('absolute', 'backend')).toBeTruthy();
		expect(registry.has('absolute')).toBeFalsy();
	});

	test('Remove & Has namespace', () => {
		registry.add(helloWorld, 'foobar');

		expect(registry.hasNamespace('foobar')).toBeTruthy();

		expect(registry.remove(null, null)).toBeFalsy();
		expect(registry.remove(null, 'invalid')).toBeFalsy();
		expect(registry.remove(null, 'foobar')).toBeTruthy();
		
		expect(registry.hasNamespace('foobar')).toBeFalsy();
		expect(registry.namespace('foobar')).toEqual([]);
	});

	test('Remove & Has user namespace', () => {
		registry.add(custom, 'user');
		expect(registry.hasNamespace('user')).toBeTruthy();
		expect(registry.remove());
		expect(registry.hasNamespace('user')).toBeFalsy();
	});

});