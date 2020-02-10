const Utils = require('../utils.js');
const Versions = require('../versions.js');

class MigrateProcessGraphs {

    // Always returns a copy of the input object
    static convertProcessGraphToLatestSpec(originalProcessGraph, version) {
        if (Versions.compare(version, "0.3.x", "<=")) {
            throw "Migrating from API version 0.3.0 and older is not supported.";
		}

        let pg = {};
        if (Utils.isObject(originalProcessGraph)) {
            pg = Utils.deepClone(originalProcessGraph);
		}

		if (Versions.compare(version, "0.4.x", "=")) {
			pg = migrateNodes(pg, version);
		}

        return pg;
	}
	
}

function migrateNodes(nodes, version) {
	for(let id in nodes) {
		if (!Utils.isObject(nodes[id].arguments)) {
			continue;
		}
		for(let argName in nodes[id].arguments) {
			nodes[id].arguments[argName] = migrateArgs(nodes[id].arguments[argName], version);
		}
	}

	return nodes;
}

function migrateArgs(arg, version) {
	if (!arg || typeof arg !== 'object') {
		return arg;
	}

	let isObject = Utils.isObject(arg);
	if (isObject && typeof arg.callback !== 'undefined') {
		arg = {
			process_graph: migrateNodes(arg.callback, version)
		};
	}
	else if (isObject && typeof arg.from_argument !== 'undefined') {
		arg = {
			from_parameter: arg.from_argument
		};
	}
	else if (isObject && typeof arg.variable_id !== 'undefined') {
		arg = {
			from_parameter: arg.variable_id
		};
	}
	else {
		for(let key in arg) {
			arg[key] = migrateArgs(arg[key]);
		}
	}

	return arg;
}

module.exports = MigrateProcessGraphs;