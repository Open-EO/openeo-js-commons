/** General utilities */
class Utils {

	/**
	 * Checks whether a variable is a real object or not.
	 * 
	 * This is a more strict version of `typeof x === 'object'` as this example would also succeeds for arrays and `null`.
	 * This function only returns `true` for real objects and not for arrays, `null` or any other data types.
	 * 
	 * @param {*} obj - A variable to check.
	 * @returns {boolean} - `true` is the given variable is an object, `false` otherwise.
	 */
	static isObject(obj) {
		return (typeof obj === 'object' && obj === Object(obj) && !Array.isArray(obj));
    }
	
	/**
	 * Computes the size of an array (number of array elements) or object (number of key-value-pairs).
	 * 
	 * Returns 0 for all other data types.
	 * 
	 * @param {*} obj 
	 * @returns {integer}
	 */
	static size(obj) {
		if (typeof obj === 'object' && obj !== null) {
			if (Array.isArray(obj)) {
				return obj.length;
			}
			else {
				return Object.keys(obj).length;
			}
		}
		return 0;
	}

	/**
	 * Checks whether a variable is numeric.
	 * 
	 * Numeric is every string with numeric data or a number, excluding NaN and finite numbers.
	 * 
	 * @param {*} n - A variable to check.
	 * @returns {boolean} - `true` is the given variable is numeric, `false` otherwise.
	 */
	static isNumeric(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
    }
    
    /**
     * Deep clone for JSON-compatible data.
     * 
     * @param {*} x - The data to clone.
     * @returns {*} - The cloned data.
     */
    static deepClone(x) {
        return JSON.parse(JSON.stringify(x));
    }

	/**
	 * Normalize a URL (mostly handling leading and trailing slashes).
	 * 
	 * @static
	 * @param {string} baseUrl - The URL to normalize
	 * @param {string} path - An optional path to add to the URL
	 * @returns {string} Normalized URL.
	 */
	static normalizeUrl(baseUrl, path = null) {
		let url = baseUrl.replace(/\/$/, ""); // Remove trailing slash from base URL
		if (typeof path === 'string') {
			if (path.substr(0, 1) !== '/') {
				path = '/' + path; // Add leading slash to path
			}
			url = url + path.replace(/\/$/, ""); // Remove trailing slash from path
		}
		return url;
	}

	/**
	 * Replaces placeholders in this format: `{var}`.
	 * 
	 * This can be used for the placeholders/variables in the openEO API's errors.json file.
	 * 
	 * @param {string} message - The string to replace the placeholders in.
	 * @param {object} variables - A map with the placeholder names as keys and the replacement value as value.
	 */
	static replacePlaceholders(message, variables = {}) {
		if (typeof message === 'string' && Utils.isObject(variables)) {
			for(var placeholder in variables) {
				let vars = variables[placeholder];
				message = message.replace('{' + placeholder + '}', Array.isArray(vars) ? vars.join("; ") : vars);
			}
		}
		return message;
	}

}

module.exports = Utils;