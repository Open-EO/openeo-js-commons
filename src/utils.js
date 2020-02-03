const compareVersions = require('compare-versions');

var Utils = {

    compareVersion(v1, v2) {
        try {
            return compareVersions(v1, v2);
        } catch (error) {
            return null;
        }
    },

	isObject(obj) {
		return (typeof obj === 'object' && obj === Object(obj) && !Array.isArray(obj));
	}

};

module.exports = Utils;