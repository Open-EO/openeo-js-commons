const MigrateProcesses = require('../../src/migrate/processes.js');

describe('Basic Process Migration Tests', () => {
	test('Migrate Process > invalid', () => {
		// Pass no version number
		expect(() => MigrateProcesses.convertProcessToLatestSpec({})).toThrow();
		expect(() => MigrateProcesses.convertProcessToLatestSpec({}, "0.3.0")).toThrow();
		// Pass invalid process (no id)
		expect(MigrateProcesses.convertProcessToLatestSpec({}, "0.4.0")).toEqual({});
		expect(MigrateProcesses.convertProcessToLatestSpec({}, "1.0.0")).toEqual({});
	});

	const incomplete = {id: "min"};
	const filled = {
		id: "min",
		description: "",
		parameters: [],
		returns: {schema: {}}
	};
	test('Migrate Process > incomplete', () => {
		// Pass just a process id and let it add required fields
		expect(MigrateProcesses.convertProcessToLatestSpec(incomplete, "0.4.0")).toEqual(filled);
		expect(MigrateProcesses.convertProcessToLatestSpec(incomplete, "1.0.0")).toEqual(filled);
	});

	const lc04 = require('./processes/0.4/load_collection.json');
	const lc10 = require('./processes/1.0/load_collection.json');
	test('Migrate Process > 0.4 > load_collection', () => {
		// Test that a v0.4 process gets converted
		expect(MigrateProcesses.convertProcessToLatestSpec(lc04, "0.4.0")).toEqual(lc10);
	});
	test('Migrate Process > 1.0 > load_collection', () => {
		// Test that a process following the latest spec doesn't change at all
		expect(MigrateProcesses.convertProcessToLatestSpec(lc10, "1.0.0")).toEqual(lc10);
	});

	const ex04 = require('./processes/0.4/example.json');
	const ex10 = require('./processes/1.0/example.json');
	test('Migrate Process > 0.4 > example', () => {
		// Test that a v0.4 process gets converted
		expect(MigrateProcesses.convertProcessToLatestSpec(ex04, "0.4.0")).toEqual(ex10);
	});
	test('Migrate Process > 1.0 > example', () => {
		// Test that a process following the latest spec doesn't change at all
		expect(MigrateProcesses.convertProcessToLatestSpec(ex10, "1.0.0")).toEqual(ex10);
	});
});