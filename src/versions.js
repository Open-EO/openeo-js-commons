const VersionCompare = require('compare-versions');

/** Version Number related methods */
class Versions {

  /**
   * Compare [semver](https://semver.org/) version strings.
   * 
   * @param {string} firstVersion First version to compare
   * @param {string} secondVersion Second version to compare
   * @param {string|null} operator Optional; Arithmetic operator to use (>, >=, =, <=, <, !=). Defaults to `null`.
   * @returns {boolean|integer} If operator is not `null`: true` if the comparison between the firstVersion and the secondVersion satisfies the operator, `false` otherwise. If operator is `null`: Numeric value compatible with the [Array.sort(fn) interface](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#Parameters).
   * ```
   */
    static compare(v1, v2, operator = null) {
		if (operator !== null) {
			return VersionCompare.compare(v1, v2, operator);
		}
		else {
			return VersionCompare(v1, v2);
		}
	}

  /**
   * Validate [semver](https://semver.org/) version strings.
   * 
   * @param {*} version - Version number to validate
   * @returns - `true` if the version number is a valid semver version number, `false` otherwise.
   */
	static validate(version) {
		return VersionCompare.validate(version);
	}

	/**
	 * Tries to determine the most suitable version from a well-known discovery document that software is compatible to.
	 * 
	 * @static
	 * @param {array} wkVersions - A well-known discovery document compliant to the API specification.
	 * @returns {object[]} - Gives a list that lists all compatible versions (as still API compliant objects) ordered from the most suitable to the least suitable.
	 */
	static findCompatible(wkVersions, preferProduction = true, minVersion = null, maxVersion = null) {
		if (!Array.isArray(wkVersions) || wkVersions.length === 0) {
			return [];
		}

		let compatible = wkVersions.filter(c => {
			if (typeof c.url === 'string' && Versions.validate(c.api_version)) {
				let hasMinVer = Versions.validate(minVersion);
				let hasMaxVer = Versions.validate(maxVersion);
				if (hasMinVer && hasMaxVer) {
					return Versions.compare(c.api_version, minVersion, ">=") && Versions.compare(c.api_version, maxVersion, "<=");
				}
				else if (hasMinVer) {
					return Versions.compare(c.api_version, minVersion, ">=");
				}
				else if (hasMaxVer) {
					return Versions.compare(c.api_version, maxVersion, "<=");
				}
				else {
					return true;
				}
			}
			return false;
		 });
		if (compatible.length === 0) {
			return [];
		}

		return compatible.sort((c1, c2) => {
			let p1 = c1.production === true;
			let p2 = c2.production === true;
			if (!preferProduction || p1 === p2) {
				return Versions.compare(c1.api_version, c2.api_version) * -1; // `* -1` to sort in descending order.
			}
			else if (p1) {
				return -1;
			}
			else {
				return 1;
			}
		});
	}

	static findLatest(wkVersions, preferProduction = true, minVersion = null, maxVersion = null) {
		let versions = Versions.findCompatible(wkVersions, preferProduction, minVersion, maxVersion);
		if (versions.length > 0) {
			return versions[0];
		}
		else {
			return null;
		}
	}
	
}

module.exports = Versions;