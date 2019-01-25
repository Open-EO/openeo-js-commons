const Utils = require('../utils.js');

var MigrateCollections = {

    guessCollectionSpecVersion(c) {
        var version = "0.4";
        // Try to guess a version
        if (typeof c.id === 'undefined') { // No id defined, probably v0.3
            version = "0.3";
        }
        return version;
    },

    // Always returns a copy of the input collection object
    convertCollectionToLatestSpec: function(originalCollection, version = null) {
        var collection = Object.assign({}, originalCollection);
        if (version === null) {
            version = this.guessCollectionSpecVersion(collection);
        }
        // convert v0.3 processes to v0.4 format
        if (Utils.compareVersion(version, "0.3.x") === 0) {
            // name => id
            collection.id = collection.name;
            delete collection.name;
            // Add stac_version
            collection.stac_version = '0.6.1';
            // Rename provider => providers
            if (Array.isArray(collection.provider)) {
                collection.providers = collection.provider;
                delete collection.provider;
            }
            if (typeof collection.properties !== 'object') {
                collection.properties = {};
            }
            // Move all other properties into properties.
            for (var key in collection) {
                if (key.includes(':')) {
                    collection.properties[key] = collection[key];
                    delete collection[key];
                }
            }
        }
        return collection;
    }

};

module.exports = MigrateCollections;