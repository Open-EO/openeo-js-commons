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
});