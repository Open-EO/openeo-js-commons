const VersionCompare = require('compare-versions');

const semver = /^v?(?:\d+)(\.(?:[x*]|\d+)(\.(?:[x*]|\d+)(\.(?:[x*]|\d+))?(?:-[\da-z\-]+(?:\.[\da-z\-]+)*)?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i;

class Versions {

    static compare(v1, v2, operator = null) {
		if (operator !== null) {
			return VersionCompare.compare(v1, v2, operator);
		}
		else {
			return VersionCompare(v1, v2);
		}
	}

	// Function or regexp is coming from compare-version, but not exposed so copied it here.
	// See also https://github.com/omichelsen/compare-versions/issues/37
	static validate(version) {
		if (typeof version !== 'string') {
			return false;
		}
		return semver.test(version);
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
			let p1 = c1.production !== false;
			let p2 = c2.production !== false;
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