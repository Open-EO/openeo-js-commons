const Utils = require('../utils.js');
const Versions = require('../versions.js');

class MigrateCommons {

	static migrateLinks(links, version, fallbackRel = 'related') {
		if (!Array.isArray(links)) {
			return [];
		}

		return links
			.filter(link => Utils.isObject(link) && typeof link.href === 'string')
			.map(link => {
				if (typeof link.rel !== 'string') {
					link.rel = fallbackRel;
				}
				return link;
			});
	}

	static migrateDiscoveryParameters(parameters, version) {
		if (Versions.compare(version, "1.0.0-rc.2", "<=")) {
			for(var name in parameters) {
				if (!Utils.isObject(parameters[name])) {
					delete parameters[name];
					continue;
				}

				let type = parameters[name].type;
				if (typeof type === 'string') {
					parameters[name].type = [type, "null"];
				}

				let example = parameters[name].example;
				if (typeof example !== 'undefined') {
					parameters[name].examples = [example];
					delete parameters[name].example;
				}
			}
		}

		return parameters;
	}

}

module.exports = MigrateCommons;