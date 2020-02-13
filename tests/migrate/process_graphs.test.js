const MigrateProcessGraphs = require('../../src/migrate/process_graphs.js');

describe('Basic Process Graph Migration Tests', () => {

	test('Migrate Process Graph > invalid', () => {
		// Pass old version number
		expect(() => MigrateProcessGraphs.convertProcessGraphToLatestSpec({}, "0.3.0")).toThrow();
		// Pass invalid data type
		expect(MigrateProcessGraphs.convertProcessGraphToLatestSpec(null, "0.4.0")).toEqual({});
		// Pass invalid process graph
		expect(MigrateProcessGraphs.convertProcessGraphToLatestSpec({}, "0.4.0")).toEqual({});
		expect(MigrateProcessGraphs.convertProcessGraphToLatestSpec({}, "1.0.0")).toEqual({});
		expect(MigrateProcessGraphs.convertProcessGraphToLatestSpec({a: "b"}, "1.0.0")).toEqual({a: "b"});
	});

	const evi04 = require('./process_graphs/0.4/evi.json');
	const evi10 = require('./process_graphs/1.0/evi.json');
	test('Migrate Process Graph > 0.4 > EVI', () => {
		// Test that a v0.4 process gets converted
		expect(MigrateProcessGraphs.convertProcessGraphToLatestSpec(evi04, "0.4.0")).toEqual(evi10);
	});
	test('Migrate Process Graph > 1.0 > EVI', () => {
		// Test that a process following the latest spec doesn't change at all
		expect(MigrateProcessGraphs.convertProcessGraphToLatestSpec(evi10, "1.0.0")).toEqual(evi10);
	});
});