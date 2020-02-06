const MigrateCollections = require('../../src/migrate/collections.js');

describe('Basic Collection Migration Tests', () => {
	test('Migrate Collection > invalid', () => {
		// Pass no version number
		expect(() => MigrateCollections.convertCollectionToLatestSpec({})).toThrow();
		expect(() => MigrateCollections.convertCollectionToLatestSpec({}, "0.3.0")).toThrow();
		// Pass invalid collection (no id)
		expect(MigrateCollections.convertCollectionToLatestSpec({}, "0.4.0")).toEqual({});
		expect(MigrateCollections.convertCollectionToLatestSpec({}, "1.0.0")).toEqual({});
	});

	const incomplete = {
		id: "stac"
	};
	const min10 = require('./collections/1.0/minimal.json');
	test('Migrate Collection > incomplete', () => {
		// Pass just a collection id and let it add required fields
		expect(MigrateCollections.convertCollectionToLatestSpec(incomplete, "0.4.0")).toEqual(min10);
		expect(MigrateCollections.convertCollectionToLatestSpec(incomplete, "1.0.0")).toEqual(min10);
	});

	const api04 = require('./collections/0.4/api-example.json');
	const api10 = require('./collections/1.0/api-example.json');
	test('Migrate Collection > 0.4 > API example', () => {
		// Test that a v0.4 collection gets converted
		expect(MigrateCollections.convertCollectionToLatestSpec(api04, "0.4.0")).toEqual(api10);
	});
	test('Migrate Collection > 1.0 > API example', () => {
		// Test that a collection following the latest spec doesn't change at all
		expect(MigrateCollections.convertCollectionToLatestSpec(api10, "1.0.0")).toEqual(api10);
	});

	const ex04 = require('./collections/0.4/example.json');
	const ex10 = require('./collections/1.0/example.json');
	test('Migrate Collection > 0.4 > example', () => {
		// Test that a v0.4 collection gets converted
		expect(MigrateCollections.convertCollectionToLatestSpec(ex04, "0.4.0")).toEqual(ex10);
	});
	test('Migrate Collection > 1.0 > example', () => {
		// Test that a collection following the latest spec doesn't change at all
		expect(MigrateCollections.convertCollectionToLatestSpec(ex10, "1.0.0")).toEqual(ex10);
	});

	const sar04 = require('./collections/0.4/sar.json');
	const sar10 = require('./collections/1.0/sar.json');
	test('Migrate Collection > 0.4 > SAR', () => {
		// Test that a v0.4 collection gets converted
		expect(MigrateCollections.convertCollectionToLatestSpec(sar04, "0.4.0")).toEqual(sar10);
	});
	test('Migrate Collection > 1.0 > SAR', () => {
		// Test that a collection following the latest spec doesn't change at all
		expect(MigrateCollections.convertCollectionToLatestSpec(sar10, "1.0.0")).toEqual(sar10);
	});
});