const MigrateCapabilities = require('../../src/migrate/capabilities.js');

describe('Basic Capabilities Migration Tests', () =>  {
	const c04min = require('./capabilities/0.4/capabilities_min.json');
	const c04full = require('./capabilities/0.4/capabilities_full.json');
	const c10minKeep = require('./capabilities/1.0/capabilities_min_keep_values.json');
	const c10minUpdate = require('./capabilities/1.0/capabilities_min_update_values.json');
	const c10empty = require('./capabilities/1.0/capabilities_empty.json');
	const c10full = require('./capabilities/1.0/capabilities_full.json');

	const ep04 = require('./capabilities/0.4/endpoints.json');
	const ep10 = require('./capabilities/1.0/endpoints.json');
	const ep10rc1 = require('./capabilities/1.0/endpoints-rc1.json');

	test('Guess Api Versions', () =>  {
		expect(MigrateCapabilities.guessApiVersion(null)).toBe("0.0.0");
		expect(MigrateCapabilities.guessApiVersion({})).toBe("0.0.0");
		expect(MigrateCapabilities.guessApiVersion({title: "openEO", endpoints: []})).toBe("0.0.0");
		expect(MigrateCapabilities.guessApiVersion({api_version: "foo"})).toBe("0.0.0");
		expect(MigrateCapabilities.guessApiVersion({endpoints: []})).toBe("0.3.1");
		expect(MigrateCapabilities.guessApiVersion({endpoints: ep04})).toBe("0.4.2");
		expect(MigrateCapabilities.guessApiVersion({endpoints: ep10})).toBe("1.0.0");
		expect(MigrateCapabilities.guessApiVersion({version: '0.3.1', endpoints: []})).toBe("0.3.1");
		expect(MigrateCapabilities.guessApiVersion(c04min)).toBe("0.4.1");
		expect(MigrateCapabilities.guessApiVersion(c04full)).toBe("0.4.2");
		expect(MigrateCapabilities.guessApiVersion(c10minUpdate)).toBe("1.0.0");
	});
-
	test('Migrate Capabilities', () =>  {
		expect(MigrateCapabilities.convertCapabilitiesToLatestSpec(null)).toEqual({});
		expect(MigrateCapabilities.convertCapabilitiesToLatestSpec({})).toEqual({});
		expect(() => MigrateCapabilities.convertCapabilitiesToLatestSpec({}, "0.3.2")).toThrow();
		expect(MigrateCapabilities.convertCapabilitiesToLatestSpec({}, "0.4.1")).toEqual(c10empty);
		expect(MigrateCapabilities.convertCapabilitiesToLatestSpec({}, "1.0.0")).toEqual(c10empty);
		// Test for changed default value of production property
		expect(MigrateCapabilities.convertCapabilitiesToLatestSpec({}, "1.0.0-rc.2")).toEqual(Object.assign({}, c10empty, {production: true}));
		// Handle invalid version numbers
		expect(MigrateCapabilities.convertCapabilitiesToLatestSpec({api_version: "foo"}, null, false)).toEqual({});
		// Test that 0.4 capabilities get converted without setting defaults
		expect(MigrateCapabilities.convertCapabilitiesToLatestSpec(c04full)).toEqual(c10full);
		expect(MigrateCapabilities.convertCapabilitiesToLatestSpec(c04full, "0.4.2")).toEqual(c10full);
		// Test that 0.4 capabilities get converted with setting defaults
		expect(MigrateCapabilities.convertCapabilitiesToLatestSpec(c04min, null, true, true, id = "test", title = "Test API", backend_version = "0.1.0")).toEqual(c10minUpdate);
		expect(MigrateCapabilities.convertCapabilitiesToLatestSpec(c04min, null, false, false, id = "test", title = "Test API", backend_version = "0.1.0")).toEqual(c10minKeep);
		expect(MigrateCapabilities.convertCapabilitiesToLatestSpec(c04min, "0.4.1", false, false, id = "test", title = "Test API", backend_version = "0.1.0")).toEqual(c10minKeep);
		// Test that capabilities following the latest spec doesn't change at all
		expect(MigrateCapabilities.convertCapabilitiesToLatestSpec(c10full)).toEqual(c10full);
		expect(MigrateCapabilities.convertCapabilitiesToLatestSpec(c10full, "1.0.0")).toEqual(c10full);
	});

	test('Migrate Billing Info', () => {
		expect(() => MigrateCapabilities.convertBillingToLatestSpec({})).toThrow();
		expect(() => MigrateCapabilities.convertBillingToLatestSpec({}, "0.3.2")).toThrow();
		expect(MigrateCapabilities.convertBillingToLatestSpec(null, "0.4.0")).toEqual({currency: null});
		expect(MigrateCapabilities.convertBillingToLatestSpec({}, "0.4.0")).toEqual({currency: null});
		expect(MigrateCapabilities.convertBillingToLatestSpec({}, "1.0.0")).toEqual({currency: null});
		// Test that 0.4 data gets converted
		expect(MigrateCapabilities.convertBillingToLatestSpec(c04full.billing, "0.4.0")).toEqual(c10full.billing); 
		// Test that endpoints following the latest spec doesn't change at all
		expect(MigrateCapabilities.convertBillingToLatestSpec(c04full.billing, "1.0.0")).toEqual(c10full.billing); 
	});

	test('Migrate Endpoints', () => {
		expect(() => MigrateCapabilities.convertEndpointsToLatestSpec([])).toThrow();
		expect(() => MigrateCapabilities.convertEndpointsToLatestSpec([], "0.3.2")).toThrow();
		expect(MigrateCapabilities.convertEndpointsToLatestSpec(null, "0.4.0")).toEqual([]);
		expect(MigrateCapabilities.convertEndpointsToLatestSpec([], "0.4.0")).toEqual([]);
		expect(MigrateCapabilities.convertEndpointsToLatestSpec([], "1.0.0")).toEqual([]);
		// Test that 0.4 data gets converted
		expect(MigrateCapabilities.convertEndpointsToLatestSpec(ep04, "0.4.0", true)).toEqual(ep10);
		expect(MigrateCapabilities.convertEndpointsToLatestSpec(c04min.endpoints, "0.4.0", false)).toEqual(c10minKeep.endpoints);
		expect(MigrateCapabilities.convertEndpointsToLatestSpec(c04min.endpoints, "0.4.0", true)).toEqual(c10minUpdate.endpoints);
		// Test that 1.0.0 RC1 data gets converted
		expect(MigrateCapabilities.convertEndpointsToLatestSpec(ep10rc1, "1.0.0-rc.1", true)).toEqual(ep10);
		// Test that endpoints following the latest spec doesn't change at all
		expect(MigrateCapabilities.convertEndpointsToLatestSpec(ep10, "1.0.0", true)).toEqual(ep10);
		expect(MigrateCapabilities.convertEndpointsToLatestSpec(c04min.endpoints, "1.0.0")).toEqual(c10minKeep.endpoints);
	});

	const ff04 = require('./capabilities/0.4/file_formats.json');
	const ff10 = require('./capabilities/1.0/file_formats.json');
	const ff10_empty = require('./capabilities/1.0/file_formats_empty.json');
	test('Migrate File Formats', () => {
		expect(() => MigrateCapabilities.convertFileFormatsToLatestSpec({})).toThrow();
		expect(() => MigrateCapabilities.convertFileFormatsToLatestSpec({}, "0.3.2")).toThrow();
		expect(MigrateCapabilities.convertFileFormatsToLatestSpec(null, "0.4.0")).toEqual(ff10_empty);
		expect(MigrateCapabilities.convertFileFormatsToLatestSpec({}, "0.4.0")).toEqual(ff10_empty);
		expect(MigrateCapabilities.convertFileFormatsToLatestSpec({}, "1.0.0")).toEqual(ff10_empty);
		expect(MigrateCapabilities.convertFileFormatsToLatestSpec({input: {PNG: {}}}, "1.0.0")).toEqual({
			input: {
				PNG: { gis_data_types: [], parameters: {} }
			},
			output: {}
		});
		// Test that 0.4 service types gets converted
		expect(MigrateCapabilities.convertFileFormatsToLatestSpec(ff04, "0.4.0")).toEqual(ff10);
		// Test that service types following the latest spec doesn't change at all
		expect(MigrateCapabilities.convertFileFormatsToLatestSpec(ff10, "1.0.0")).toEqual(ff10);

		// Check old output_formats alias
		expect(MigrateCapabilities.convertOutputFormatsToLatestSpec({}, "0.4.0")).toEqual(ff10_empty);
		expect(MigrateCapabilities.convertOutputFormatsToLatestSpec({}, "1.0.0")).toEqual(ff10_empty);
		expect(MigrateCapabilities.convertOutputFormatsToLatestSpec(ff04, "0.4.0")).toEqual(ff10);
		expect(MigrateCapabilities.convertOutputFormatsToLatestSpec(ff10, "1.0.0")).toEqual(ff10);
	});

	const st04 = require('./capabilities/0.4/service_types.json');
	const st10 = require('./capabilities/1.0/service_types.json');
	const st10rc2 = require('./capabilities/1.0/service_types-rc2.json');
	test('Migrate Service Types', () =>  {
		expect(() => MigrateCapabilities.convertServiceTypesToLatestSpec({})).toThrow();
		expect(() => MigrateCapabilities.convertServiceTypesToLatestSpec({}, "0.3.2")).toThrow();
		expect(MigrateCapabilities.convertServiceTypesToLatestSpec(null, "0.4.0")).toEqual({});
		expect(MigrateCapabilities.convertServiceTypesToLatestSpec({}, "0.4.0")).toEqual({});
		expect(MigrateCapabilities.convertServiceTypesToLatestSpec({}, "1.0.0")).toEqual({});
		// Handle invalid service types
		expect(MigrateCapabilities.convertServiceTypesToLatestSpec({OGC: null}, "0.4.0")).toEqual({OGC: {configuration: {}, process_parameters: []}});
		// Test that legacy service types get converted
		expect(MigrateCapabilities.convertServiceTypesToLatestSpec(st04, "0.4.0")).toEqual(st10);
		expect(MigrateCapabilities.convertServiceTypesToLatestSpec(st10rc2, "1.0.0-rc.2")).toEqual(st10);
		// Test that service types following the latest spec doesn't change at all
		expect(MigrateCapabilities.convertServiceTypesToLatestSpec(st10, "1.0.0")).toEqual(st10);
	});

	const udf04 = require('./capabilities/0.4/udf_runtimes.json');
	const udf10 = require('./capabilities/1.0/udf_runtimes.json');
	test('Migrate UDF Runtimes', () =>  {
		expect(() => MigrateCapabilities.convertUdfRuntimesToLatestSpec({})).toThrow();
		expect(() => MigrateCapabilities.convertUdfRuntimesToLatestSpec({}, "0.3.2")).toThrow();
		expect(MigrateCapabilities.convertUdfRuntimesToLatestSpec(null, "0.4.0")).toEqual({});
		expect(MigrateCapabilities.convertUdfRuntimesToLatestSpec({}, "0.4.0")).toEqual({});
		expect(MigrateCapabilities.convertUdfRuntimesToLatestSpec({}, "1.0.0")).toEqual({});
		// Handle invalid runtimes
		expect(MigrateCapabilities.convertUdfRuntimesToLatestSpec({brainfuck: null}, "0.4.0")).toEqual({});
		// Test that 0.4 UDF runtimes gets converted
		expect(MigrateCapabilities.convertUdfRuntimesToLatestSpec(udf04, "0.4.0")).toEqual(udf10);
		// Test that UDF runtimes following the latest spec doesn't change at all
		expect(MigrateCapabilities.convertUdfRuntimesToLatestSpec(udf10, "1.0.0")).toEqual(udf10);
	});
});