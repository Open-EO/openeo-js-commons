const Utils = require('../src/utils.js');

describe('Utils Tests', () => {

	test('isObject', () => {
		class Test {}
		expect(Utils.isObject(null)).toBe(false); // null
		expect(Utils.isObject([])).toBe(false); // array
		expect(Utils.isObject(123)).toBe(false); // number
		expect(Utils.isObject(Math.min)).toBe(false); // function
		expect(Utils.isObject({})).toBe(true); // plain object
		expect(Utils.isObject(new Test())).toBe(true); // object instance
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

});