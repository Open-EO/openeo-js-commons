const MigrateCapabilities = require('../src/migrate/capabilities.js');

var legacyCapability = {
	"version": "0.3.1",
	"endpoints": [
		{
			"path": "/processes",
			"methods": [
				"GET"
			]
		}
	]
};

var emptyCapability = {
	"api_version": "0.4.0",
	"backend_version": "0.4.0",
	"title": "Unknown",
	"description": "No description provided.",
	"endpoints": []
};

var expectedCapability = Object.assign({}, emptyCapability, {
	"endpoints": [
		{
			"path": "/processes",
			"methods": [
				"GET"
			]
		}
	]
});

describe('Basic Capabilities Migration Tests', () => {
	test('Guess Api Versions', () => {
		expect(MigrateCapabilities.guessApiVersion(legacyCapability)).toBe("0.3.1");
		expect(MigrateCapabilities.guessApiVersion(expectedCapability)).toBe("0.4.0");
	});
	test('Migrate Capabilities', () => {
		expect(MigrateCapabilities.convertCapabilitiesToLatestSpec({})).toEqual(emptyCapability);
		// Test that a legacy capability gets converted
		expect(MigrateCapabilities.convertCapabilitiesToLatestSpec(legacyCapability)).toEqual(expectedCapability);
		expect(MigrateCapabilities.convertCapabilitiesToLatestSpec(legacyCapability, "0.3.1")).toEqual(expectedCapability);
		// Test that a capability following the latest spec doesn't change at all
		expect(MigrateCapabilities.convertCapabilitiesToLatestSpec(expectedCapability)).toEqual(expectedCapability);
		expect(MigrateCapabilities.convertCapabilitiesToLatestSpec(expectedCapability, "0.4.0")).toEqual(expectedCapability);
	});
});