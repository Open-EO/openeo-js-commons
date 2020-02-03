// Migrations
const MigrateCapabilities = require('./migrate/capabilities');
const MigrateCollections = require('./migrate/collections');
const MigrateProcesses = require('./migrate/processes');
// Others
const FeatureList = require('./featurelist');
const Utils = require('./utils');

module.exports = {
	MigrateCapabilities,
	MigrateCollections,
	MigrateProcesses,

	FeatureList,
	Utils
};