const ProcessSchema = require('./processSchema');

/**
 * Wrapper class for a process parameter.
 * 
 * @class
 */
class ProcessParameter extends ProcessSchema {

	/**
	 * Constructs a new process parameter based on the openEO API representation.
	 * 
	 * @param {object} parameter 
	 */
	constructor(parameter) {
		super(parameter.schema, parameter.default);

		Object.assign(this, parameter);
	}

}

module.exports = ProcessParameter;