const Utils = require('../src/utils.js');


describe('Utils Tests', () => {
	test('compareVersion', () => {
		expect(Utils.compareVersion("0.3.x", "0.3")).toBe(0);
		expect(Utils.compareVersion("0.3.x", "0.4")).toBe(-1);
		expect(Utils.compareVersion("0.3.0", "0.3")).toBe(0);
		expect(Utils.compareVersion("0.3.x", "0.3.1")).toBe(0);
		expect(Utils.compareVersion("0.3.1", "0.3")).toBe(1);
		expect(Utils.compareVersion("0.3", "")).toBeNull();
		expect(Utils.compareVersion("0.3", null)).toBeNull();
	});
	test('isObject', () => {
		class Test {}
		expect(Utils.isObject(null)).toBe(false); // null
		expect(Utils.isObject([])).toBe(false); // array
		expect(Utils.isObject(123)).toBe(false); // number
		expect(Utils.isObject(Math.min)).toBe(false); // function
		expect(Utils.isObject({})).toBe(true); // plain object
		expect(Utils.isObject(new Test())).toBe(true); // object instance
	});
});