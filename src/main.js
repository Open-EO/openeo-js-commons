// Migrations
const MigrateCapabilities = require('./migrate/capabilities');
const MigrateCollections = require('./migrate/collections');
const MigrateProcesses = require('./migrate/processes');
// Processes
const ProcessDataType = require('./processDataType');
const ProcessParameter = require('./processParameter');
const ProcessSchema = require('./processSchema');
const ProcessUtils = require('./processUtils');
const ProcessRegistry = require('./processRegistry');
// Others
const Versions = require('./versions');
const Utils = require('./utils');

module.exports = {
	MigrateCapabilities,
	MigrateCollections,
	MigrateProcesses,
	ProcessDataType,
	ProcessParameter,
	ProcessSchema,
	ProcessUtils,
	ProcessRegistry,
	Versions,
	Utils,
};