const Versions = require('../src/versions.js');

const v051prod = {
	"url": "https://www.openeo.org/api/v0.5",
	"api_version": "0.5.1"
};
const v100rc1 = {
	"url": "https://www.openeo.org/api/v1.0rc",
	"production": false,
	"api_version": "1.0.0-rc.1"
};
const v100prod = {
	"url": "https://www.openeo.org/api/v1.0",
	"api_version": "1.0.0"
};
const v110beta = {
	"url": "https://www.openeo.org/api/v1.1",
	"production": false,
	"api_version": "1.1.0-beta"
};

describe('Versions Tests', () => {
	test('validate', () => {
		expect(Versions.validate("0.3.x")).toBe(true);
		expect(Versions.validate("0.4")).toBe(true);
		expect(Versions.validate("1.0.0-rc1")).toBe(true);
		expect(Versions.validate("1.0.0-rc.1")).toBe(true);
		expect(Versions.validate("0.0.0")).toBe(true);
		expect(Versions.validate("")).toBe(false);
		expect(Versions.validate(null)).toBe(false);
	});
	test('compare without operator', () => {
		expect(Versions.compare("0.3.x", "0.3")).toBe(0);
		expect(Versions.compare("0.3.x", "0.4")).toBe(-1);
		expect(Versions.compare("0.3.0", "0.3")).toBe(0);
		expect(Versions.compare("0.3.x", "0.3.1")).toBe(0);
		expect(Versions.compare("0.3.1", "0.3")).toBe(1);
		expect(Versions.compare("0.3", "")).toBeNull();
		expect(Versions.compare("0.3", null)).toBeNull();
	});
	test('findCompatible', () => {
		expect(Versions.findCompatible([])).toEqual([]);
		expect(Versions.findCompatible([{},{api_version: "foo"}])).toEqual([]);
		expect(Versions.findCompatible([v051prod, v100rc1, v100prod, v110beta])).toEqual([v100prod, v051prod, v110beta, v100rc1]);
		expect(Versions.findCompatible([v110beta, v100prod, v100rc1, v051prod])).toEqual([v100prod, v051prod, v110beta, v100rc1]);
		expect(Versions.findCompatible([v110beta])).toEqual([v110beta]);
		expect(Versions.findCompatible([v051prod, v100rc1, v100prod, v110beta], false)).toEqual([v110beta, v100prod, v100rc1, v051prod]);
		expect(Versions.findCompatible([v051prod, v100prod, v110beta], true, null, "0.6.0")).toEqual([v051prod]);
		expect(Versions.findCompatible([v051prod, v100prod, v110beta], true, null, "0.5.0")).toEqual([]);
		expect(Versions.findCompatible([v051prod, v100prod, v110beta], false, "0.5.0")).toEqual([v110beta, v100prod, v051prod]);
		expect(Versions.findCompatible([v051prod, v100prod, v110beta], true, "0.5.x", "0.5.x")).toEqual([v051prod]);
		expect(Versions.findCompatible([v051prod, v100rc1, v100prod, v110beta], false, "0.4.0", "1.0.x")).toEqual([v100prod, v100rc1, v051prod]);
		expect(Versions.findCompatible([v051prod, v100prod, v110beta, v110beta], true, "1.0.1", "1.1.x")).toEqual([v110beta, v110beta]);
	});
	test('findLatest', () => {
		expect(Versions.findLatest([])).toBe(null);
		expect(Versions.findLatest([{},{api_version: "foo"}])).toBe(null);
		expect(Versions.findLatest([v051prod, v100rc1, v100prod, v110beta])).toEqual(v100prod);
		expect(Versions.findLatest([v110beta, v100prod, v100rc1, v051prod])).toEqual(v100prod);
		expect(Versions.findLatest([v110beta])).toEqual(v110beta);
		expect(Versions.findLatest([v051prod, v100rc1, v100prod, v110beta], false)).toEqual(v110beta);
		expect(Versions.findLatest([v051prod, v100prod, v110beta], true, null, "0.6.0")).toEqual(v051prod);
		expect(Versions.findLatest([v051prod, v100prod, v110beta], true, null, "0.5.0")).toBe(null);
		expect(Versions.findLatest([v051prod, v100prod, v110beta], false, "0.5.0")).toEqual(v110beta);
		expect(Versions.findLatest([v051prod, v100prod, v110beta], true, "0.5.x", "0.5.x")).toEqual(v051prod);
		expect(Versions.findLatest([v051prod, v100rc1, v100prod, v110beta], false, "0.4.0", "1.0.x")).toEqual(v100prod);
		expect(Versions.findLatest([v051prod, v100prod, v110beta, v110beta], true, "1.0.1", "1.1.x")).toEqual(v110beta);
	});
});