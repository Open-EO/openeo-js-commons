const Utils = require('../src/utils.js');

describe('Utils Tests', () => {

	class Test {}
	test('isObject', () => {
		expect(Utils.isObject(null)).toBe(false); // null
		expect(Utils.isObject(true)).toBe(false); // boolean
		expect(Utils.isObject([])).toBe(false); // array
		expect(Utils.isObject(123)).toBe(false); // number
		expect(Utils.isObject(Math.min)).toBe(false); // function
		expect(Utils.isObject({})).toBe(true); // plain object
		expect(Utils.isObject(new Test())).toBe(true); // object instance
	});

	test('size', () => {
		expect(Utils.size(null)).toBe(0);
		expect(Utils.size({})).toBe(0);
		expect(Utils.size({a: 1, b: 2})).toBe(2);
		expect(Utils.size({a: 1, b: () => {}})).toBe(2);
		expect(Utils.size([])).toBe(0);
		expect(Utils.size([1,2,3])).toBe(3);
	});

	test('isNumeric', () => {
		expect(Utils.isNumeric(null)).toBe(false);
		expect(Utils.isNumeric(true)).toBe(false);
		expect(Utils.isNumeric([])).toBe(false);
		expect(Utils.isNumeric(Math.min)).toBe(false);
		expect(Utils.isNumeric({})).toBe(false);
		expect(Utils.isNumeric(new Test())).toBe(false);
		expect(Utils.isNumeric(NaN)).toBe(false);
		expect(Utils.isNumeric(Infinity)).toBe(false);
		expect(Utils.isNumeric("123")).toBe(true);
		expect(Utils.isNumeric(123)).toBe(true);
		expect(Utils.isNumeric(123.456)).toBe(true);
		expect(Utils.isNumeric(1e+10)).toBe(true);
	});

	test('deepClone', () => {
		expect(Utils.deepClone(null)).toEqual(null); // null
		expect(Utils.deepClone([])).toEqual([]); // array
		expect(Utils.deepClone([1,2,3])).toEqual([1,2,3]);
		expect(Utils.deepClone(123)).toEqual(123); // number
		expect(Utils.deepClone(123.01)).toEqual(123.01);
		expect(Utils.deepClone({})).toEqual({}); // object
		expect(Utils.deepClone({a:"b"})).toEqual({a:"b"});
		expect(Utils.deepClone({a:"b",c:{d:"e"}})).toEqual({a:"b",c:{d:"e"}});
	});

	test('normalizeUrl', () => {
		expect(Utils.normalizeUrl("http://www.example.com")).toEqual("http://www.example.com");
		expect(Utils.normalizeUrl("http://www.example.com/")).toEqual("http://www.example.com");
		expect(Utils.normalizeUrl("http://www.example.com/abc/")).toEqual("http://www.example.com/abc");
		expect(Utils.normalizeUrl("http://www.example.com/abc/index.html")).toEqual("http://www.example.com/abc/index.html");
		expect(Utils.normalizeUrl("http://www.example.com", "/index.html")).toEqual("http://www.example.com/index.html");
		expect(Utils.normalizeUrl("http://www.example.com/", "/index.html")).toEqual("http://www.example.com/index.html");
		expect(Utils.normalizeUrl("http://www.example.com", "index.html")).toEqual("http://www.example.com/index.html");
		expect(Utils.normalizeUrl("http://www.example.com/", "/abc/")).toEqual("http://www.example.com/abc");
	});

	test('replacePlaceholders', () => {
		expect(Utils.replacePlaceholders(null)).toBe(null);
		expect(Utils.replacePlaceholders("Simpler Test")).toBe("Simpler Test");
		expect(Utils.replacePlaceholders("Eine Variable: {x}", {x: 123})).toBe("Eine Variable: 123");
		expect(Utils.replacePlaceholders("{multiple} {vars}: {undefined}", {multiple: "Multiple", vars: "Variables", more: "Unused"})).toBe("Multiple Variables: {undefined}");
		expect(Utils.replacePlaceholders("Eine Liste: {x}", {x: [1,2,"3"]})).toBe("Eine Liste: 1; 2; 3");
	});

});