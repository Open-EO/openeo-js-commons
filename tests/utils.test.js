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

	test('unique', () => {
		expect(Utils.unique([])).toEqual([]);
		expect(Utils.unique([123, 123])).toEqual([123]);
		expect(Utils.unique([123, "123"])).toEqual([123, "123"]);
		expect(Utils.unique(["a", "a", "b", "a"])).toEqual(["a", "b"]);
	});

	test('equals', () => {
		// Just a basic set of tests, is better tested in the dependency
		expect(Utils.equals([], [])).toBeTruthy();
		expect(Utils.equals([123], [123])).toBeTruthy();
		expect(Utils.equals([123, [1,2,3]], [123, [1,2,3]])).toBeTruthy();
		expect(Utils.equals([123, [1,2,3,4]], [123, [1,2,3]])).toBeFalsy();
		expect(Utils.equals(1, true)).toBeFalsy();
		expect(Utils.equals(0, null)).toBeFalsy();
		expect(Utils.equals({a:"a"}, {a:"a"})).toBeTruthy();
		expect(Utils.equals({a:"a"}, {a:"b"})).toBeFalsy();
	});

	let obj = {
		a: {id: "a"},
		b: {id: "b"},
		c: {id: "e"}
	};
	let obj2 = {
		a: "a",
		b: "b",
		c: "e"
	};
	test('mapObject', () => {
		expect(Utils.mapObject(obj, o => o.id)).toEqual(["a", "b", "e"]);
	});

	test('mapObjectValues', () => {
		expect(Utils.mapObjectValues(obj, o => o.id)).toEqual(obj2);
	});

	test('omitFromObject', () => {
		expect(Utils.omitFromObject(null, "a")).toEqual({});
		expect(Utils.omitFromObject(obj2, "a")).toEqual({
			b: "b",
			c: "e"
		});
		expect(Utils.omitFromObject(obj2, ["a", "b"])).toEqual({
			c: "e"
		});
	});

	test('pickFromObject', () => {
		expect(Utils.pickFromObject(null, "a")).toEqual({});
		expect(Utils.pickFromObject(obj2, "a")).toEqual({
			a: "a"
		});
		expect(Utils.pickFromObject(obj2, ["a", "b"])).toEqual({
			a: "a",
			b: "b"
		});
	});

	test('deepClone', () => {
		expect(Utils.deepClone(null)).toEqual(null); // null
		expect(Utils.deepClone([])).toEqual([]); // array
		expect(Utils.deepClone([1,2,3])).toEqual([1,2,3]);
		expect(Utils.deepClone(123)).toEqual(123); // number
		expect(Utils.deepClone(123.01)).toEqual(123.01);
		expect(Utils.deepClone({})).toEqual({}); // object
		expect(Utils.deepClone({a:"b"})).toEqual({a:"b"});
		let o1 = {a:"b",c:{d:"e"}};
		let o2 = {a:"b",c:{d:"e"}};
		let c = Utils.deepClone(o1);
		expect(c).toEqual(o2);
		expect(c).not.toBe(o1);
	});

	test('normalizeUrl', () => {
		expect(Utils.normalizeUrl("http://www.example.com")).toBe("http://www.example.com");
		expect(Utils.normalizeUrl("http://www.example.com/")).toBe("http://www.example.com");
		expect(Utils.normalizeUrl("http://www.example.com/abc/")).toBe("http://www.example.com/abc");
		expect(Utils.normalizeUrl("http://www.example.com/abc/index.html")).toBe("http://www.example.com/abc/index.html");
		expect(Utils.normalizeUrl("http://www.example.com", "/index.html")).toBe("http://www.example.com/index.html");
		expect(Utils.normalizeUrl("http://www.example.com/", "/index.html")).toBe("http://www.example.com/index.html");
		expect(Utils.normalizeUrl("http://www.example.com", "index.html")).toBe("http://www.example.com/index.html");
		expect(Utils.normalizeUrl("http://www.example.com/", "/abc/")).toBe("http://www.example.com/abc");
	});

	test('replacePlaceholders', () => {
		expect(Utils.replacePlaceholders(null)).toBe(null);
		expect(Utils.replacePlaceholders("Simpler Test")).toBe("Simpler Test");
		expect(Utils.replacePlaceholders("Eine Variable: {x}", {x: 123})).toBe("Eine Variable: 123");
		expect(Utils.replacePlaceholders("{multiple} {vars}: {undefined}", {multiple: "Multiple", vars: "Variables", more: "Unused"})).toBe("Multiple Variables: {undefined}");
		expect(Utils.replacePlaceholders("Eine Liste: {x}", {x: [1,2,"3"]})).toBe("Eine Liste: 1; 2; 3");
	});

	test('compareStringCaseInsensitive', () => {
		expect(Utils.compareStringCaseInsensitive("a", "b")).toBe(-1);
		expect(Utils.compareStringCaseInsensitive("b", "a")).toBe(1);
		expect(Utils.compareStringCaseInsensitive("b", "B")).toBe(0);
		expect(Utils.compareStringCaseInsensitive(1, 2)).toBe(-1);
		expect(Utils.compareStringCaseInsensitive(10, 100)).toBe(-1);
		expect(Utils.compareStringCaseInsensitive("10B", "100B")).toBe(-1);
		expect(Utils.compareStringCaseInsensitive("B10", "B100")).toBe(-1);
	});

	test('prettifyString', () => {
		class Hello {}
		expect(Utils.prettifyString(null)).toBe("Null");
		expect(Utils.prettifyString(true)).toBe("True");
		expect(Utils.prettifyString(false)).toBe("False");

		expect(Utils.prettifyString([])).toBe("");
		expect(Utils.prettifyString(["ab"])).toBe("ab");
		expect(Utils.prettifyString(["abc"])).toBe("Abc");
		expect(Utils.prettifyString(["aBC"])).toBe("A BC");
		expect(Utils.prettifyString(["it's", "my", "life"], " ")).toBe("It's my Life");
		expect(Utils.prettifyString(["abc-def", "xyz"])).toBe("Abc Def; Xyz");

		expect(Utils.prettifyString({})).toBe("[object Object]");
		expect(Utils.prettifyString(new Hello())).toBe("[object Object]");
		expect(Utils.prettifyString(123)).toBe("123");

		expect(Utils.prettifyString("")).toBe("");
		expect(Utils.prettifyString("a")).toBe("a");
		expect(Utils.prettifyString("aB")).toBe("aB");
		expect(Utils.prettifyString("abc")).toBe("Abc");
		expect(Utils.prettifyString("hello-world")).toBe("Hello World");
		expect(Utils.prettifyString("hello_world")).toBe("Hello World");
		expect(Utils.prettifyString("helloWorld")).toBe("Hello World");
		expect(Utils.prettifyString("Hello World")).toBe("Hello World");
		expect(Utils.prettifyString("hello world")).toBe("Hello world");
		expect(Utils.prettifyString("i-love-you")).toBe("I Love You");
		expect(Utils.prettifyString("i_love_you")).toBe("I Love You");
		expect(Utils.prettifyString("iLoveYou")).toBe("I Love You");
		expect(Utils.prettifyString("PHP")).toBe("PHP");
		expect(Utils.prettifyString("phpBB")).toBe("Php BB");
	});

	test('friendlyLinks', () => {
		let href = 'http://www.openeo.org';
		let selfLink = {href, rel: 'self', title: 'This document'};
		let aLink = {href: 'http://a.bc', title: 'A', rel: 'a'};
		let bLink = {href: 'http://c.de', title: 'B', rel: 'b'};
		let unsortedLinks = [bLink, aLink];
		expect(Utils.friendlyLinks(null)).toEqual([]);
		expect(Utils.friendlyLinks([])).toEqual([]);
		expect(Utils.friendlyLinks([{href}])).toEqual([{href, title: 'openeo.org'}]);
		expect(Utils.friendlyLinks([{href, rel: 'about'}])).toEqual([{href: 'http://www.openeo.org', rel: 'about', title: 'About'}]);
		expect(Utils.friendlyLinks([selfLink])).toEqual([]);
		expect(Utils.friendlyLinks([selfLink], true, [])).toEqual([selfLink]);
		expect(Utils.friendlyLinks(unsortedLinks)).toEqual([aLink, bLink]);
		expect(Utils.friendlyLinks(unsortedLinks, false)).toEqual(unsortedLinks);
	});

});