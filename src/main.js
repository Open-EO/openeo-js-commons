// Migrations
const MigrateCapabilities = require('./migrate/capabilities');
const MigrateCollections = require('./migrate/collections');
const MigrateProcesses = require('./migrate/processes');
const MigrateProcessGraphs = require('./migrate/process_graphs.js');
// Others
const Versions = require('./versions');
const Utils = require('./utils');

module.exports = {
	MigrateCapabilities,
	MigrateCollections,
	MigrateProcesses,
	MigrateProcessGraphs,
	Versions,
	Utils,
};