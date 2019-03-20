const Utils = require('../utils.js');

var MigrateProcesses = {

    guessProcessSpecVersion(p) {
        var version = "0.4";
        // Try to guess a version
        if (typeof p.id === 'undefined' && typeof p.name !== 'undefined') { // No id defined, probably v0.3
            version = "0.3";
        }
        return version;
    },

    // Always returns a copy of the input process object
    convertProcessToLatestSpec: function(originalProcess, version = null) {
        var process = Object.assign({}, originalProcess);
        if (version === null) {
            version = this.guessProcessSpecVersion(process);
        }
        // convert v0.3 processes to v0.4 format
        if (Utils.compareVersion(version, "0.3.x") === 0) {
            // name => id
            if (typeof process.name !== 'undefined') {
                process.id = process.name;
                delete process.name;
            }
            // mime_type => media_type
            if (typeof process.parameters === 'object') {
                for(var key in process.parameters) {
                    var param = process.parameters[key];
                    if (typeof param.mime_type !== 'undefined') {
                        param.media_type = param.mime_type;
                        delete param.mime_type;
                    }
                }
            }
            if (typeof process.returns === 'object' && typeof process.returns.mime_type !== 'undefined') {
                process.returns.media_type = process.returns.mime_type;
                delete process.returns.mime_type;
            }
            // exception object
            if (typeof process.exceptions === 'object') {
                for(var key in process.exceptions) {
                    if (typeof process.exceptions[key].message === 'undefined') {
                        process.exceptions[key].message = process.exceptions[key].description;
                    }
                }
            }
            // examples object
            if (typeof process.examples === 'object') {
                var examples = [];
                for(var key in process.examples) {
                    var old = process.examples[key];
                    var example = {
                        title: old.summary || key,
                        description: old.description
                    };
                    if (old.process_graph) {
                        example.process_graph = old.process_graph;
                    }
                    examples.push(example);
                }
                process.examples = examples;
            }

            // Fill parameter order
			if (typeof process.parameters === 'object' && !Array.isArray(process.parameter_order)) {
                var parameter_order = Object.keys(process.parameters);
                if (parameter_order.length > 1) {
                    process.parameter_order = parameter_order;
                }
			}
        }
        return process;
    }

};

module.exports = MigrateProcesses;