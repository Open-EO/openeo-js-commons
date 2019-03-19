const Utils = require('../utils.js');

var MigrateCapabilities = {

    guessApiVersion(capabilties) {
		if (typeof capabilties.version === 'string') {
			return capabilties.version;
		}
		else if (typeof capabilties.api_version === 'string') {
			return capabilties.api_version;
		}
		else if (capabilties.backend_version || capabilties.title || capabilties.description || capabilties.links) {
			return "0.4";
		}
		else {
			// This is a wild guess
			return "0.3";
		}
    },

    // Always returns a copy of the input object
    convertCapabilitiesToLatestSpec: function(originalCapabilities, version = null, title = "Unknown") {
        var capabilities = Object.assign({}, originalCapabilities);
        if (version === null) {
            version = this.guessApiVersion(capabilities);
        }
        // convert v0.3 processes to v0.4 format
        if (Utils.compareVersion(version, "0.3.x") === 0) {
            // version => api_version
			capabilities.api_version = "0.4.0";
            if (typeof capabilities.version !== 'undefined') {
                delete capabilities.version;
			}

			// Add missing fields with somewhat useful data
            if (typeof capabilities.backend_version !== 'string') {
                capabilities.backend_version = capabilities.api_version;
			}
            if (typeof capabilities.title !== 'string') {
                capabilities.title = title;
			}
            if (typeof capabilities.description !== 'string') {
                capabilities.description = "No description provided.";
			}
            if (!Array.isArray(capabilities.endpoints)) {
                capabilities.endpoints = [];
			}
        }
        return capabilities;
    },

    // Always returns a copy of the input object
    convertOutputFormatsToLatestSpec: function(originalFormats, version) {
        var formats = Object.assign({}, originalFormats);
        // convert v0.3 processes to v0.4 format
        if (Utils.compareVersion(version, "0.3.x") === 0) {
            // ...
            throw "Not implemented yet";
        }
        return formats;
    },

    // Always returns a copy of the input object
    convertServiceTypesToLatestSpec: function(originalTypes, version) {
        var types = Object.assign({}, originalTypes);
        // convert v0.3 processes to v0.4 format
        if (Utils.compareVersion(version, "0.3.x") === 0) {
            // ...
            throw "Not implemented yet";
        }
        return types;
    }

};

module.exports = MigrateCapabilities;