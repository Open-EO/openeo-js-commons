const MigrateCollections = require('../src/migrate/collections.js');

var legacyCollection = {
	"name": "Sentinel-2A",
	"title": "Sentinel-2A MSI L1C",
	"description": "...",
	"license": "proprietary",
	"keywords": [
		"copernicus"
	],
	"provider": [
		{
			"name": "European Space Agency (ESA)",
			"url": "https://sentinel.esa.int/web/sentinel/user-guides/sentinel-2-msi"
		}
	],
	"extent": {
		"spatial": [180,-56,-180,83],
		"temporal": ["2015-06-23T00:00:00Z",null]
	},
	"links": [
		{
			"rel": "self",
			"href": "https://openeo.org/api/collections/Sentinel-2A"
		},
		{
			"rel": "license",
			"href": "https://scihub.copernicus.eu/twiki/pub/SciHubWebPortal/TermsConditions/Sentinel_Data_Terms_and_Conditions.pdf"
		},
		{
			"rel": "about",
			"href": "https://earth.esa.int/web/sentinel/user-guides/sentinel-2-msi/product-types/level-1c",
			"title": "ESA Sentinel-2 MSI Level-1C User Guide"
		}
	],
	"sci:citation": "Copernicus Sentinel data [Year]",
	"eo:epsg": 32632,
	"eo:platform": "sentinel-2a",
	"eo:constellation": "sentinel-2"
};

var expectedCollection = {
	"stac_version": "0.6.1",
	"id": "Sentinel-2A",
	"title": "Sentinel-2A MSI L1C",
	"description": "...",
	"license": "proprietary",
	"keywords": [
		"copernicus"
	],
	"providers": [
		{
			"name": "European Space Agency (ESA)",
			"url": "https://sentinel.esa.int/web/sentinel/user-guides/sentinel-2-msi"
		}
	],
	"extent": {
		"spatial": [180,-56,-180,83],
		"temporal": ["2015-06-23T00:00:00Z",null]
	},
	"links": [
		{
			"rel": "self",
			"href": "https://openeo.org/api/collections/Sentinel-2A"
		},
		{
			"rel": "license",
			"href": "https://scihub.copernicus.eu/twiki/pub/SciHubWebPortal/TermsConditions/Sentinel_Data_Terms_and_Conditions.pdf"
		},
		{
			"rel": "about",
			"href": "https://earth.esa.int/web/sentinel/user-guides/sentinel-2-msi/product-types/level-1c",
			"title": "ESA Sentinel-2 MSI Level-1C User Guide"
		}
	],
	"properties": {
		"sci:citation": "Copernicus Sentinel data [Year]",
		"eo:epsg": 32632,
		"eo:platform": "sentinel-2a",
		"eo:constellation": "sentinel-2"
	}
};

describe('Basic Collection Migration Tests', () => {
	test('Guess Collection Spec Versions', () => {
		expect(MigrateCollections.guessCollectionSpecVersion(legacyCollection)).toBe("0.3");
		expect(MigrateCollections.guessCollectionSpecVersion(expectedCollection)).toBe("0.4");
	});
	test('Migrate Collection', () => {
		// Test that a legacy collection gets converted
		expect(MigrateCollections.convertCollectionToLatestSpec(legacyCollection)).toEqual(expectedCollection);
		expect(MigrateCollections.convertCollectionToLatestSpec(legacyCollection, "0.3.1")).toEqual(expectedCollection);
		// Test that a collection following the latest spec doesn't change at all
		expect(MigrateCollections.convertCollectionToLatestSpec(expectedCollection)).toEqual(expectedCollection);
		expect(MigrateCollections.convertCollectionToLatestSpec(expectedCollection, "0.4.0")).toEqual(expectedCollection);
	});
});