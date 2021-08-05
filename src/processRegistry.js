const Utils = require('./utils');

/**
 * Central registry for processes.
 * 
 * @todo Doku
 * @class
 */
class ProcessRegistry {

	/**
	 * Creates a new registry of all processes.
	 * 
	 * @param {Array.<object>} [processes=[]] Optionally, a list of predefined processes
	 */
	constructor(processes = []) {
		// Keys added to this object must be lowercase!
		this.processes = {};
		this.addAll(processes);
	}

	/**
	 * Adds a list of processes for a given namespace.
	 * 
	 * @param {Array.<object>} processes Optionally, a list of processes
	 * @param {string} [namespace="backend"] The namespace for the processes (defaults to 'backend', i.e. pre-defined processes)
	 */
	addAll(processes, namespace = 'backend') {
		for(var i in processes) {
			this.add(processes[i], namespace);
		}
	}

	/**
	 * Adds a single process to a given namespace.
	 * 
	 * @param {object} processes A process definition
	 * @param {string} [namespace="backend"] The namespace for the process (defaults to 'backend', i.e. pre-defined processes)
	 */
	add(process, namespace = 'backend') {
		if (!Utils.isObject(process)) {
			throw new Error("Invalid process; not an object.");
		}
		if (typeof process.id !== 'string') {
			throw new Error("Invalid process; no id specified.");
		}
		if (typeof namespace !== 'string') {
			throw new Error("Invalid namespace; not a string.");
		}

		namespace = namespace.toLowerCase();
		if (!this.processes[namespace]) {
			this.processes[namespace] = {};
		}
		this.processes[namespace][process.id.toLowerCase()] = process;
	}

	/**
	 * Returns the count of all processes independant of the namespaces.
	 * 
	 * @returns {number} 
	 */
	count() {
		return Utils.size(this.all());
	}

	/**
	 * Returns all processes as a list, independant of the namespaces.
	 * 
	 * @returns {Array.<object>} 
	 */
	all() {
		let processes = [];
		for(let ns in this.processes) {
			processes = processes.concat(Object.values(this.processes[ns]));
		}
		return processes;
	}

	/**
	 * Checks whether a namespace exists (i.e. at least one process for the namespace exists)
	 * 
	 * @param {string} namespace The namespace
	 * @returns {boolean}
	 */
	hasNamespace(namespace) {
		if(typeof namespace !== 'string') {
			return false;
		}
		return Boolean(this.processes[namespace.toLowerCase()]);
	}

	/**
	 * Returns all processes from a specific namespace.
	 * 
	 * Returns an empty list if the namespace is not defined.
	 * 
	 * @param {string} namespace The namespace of the processes to return (e.g. 'backend' for pre-defined processes)
	 * @returns {Array.<object>} 
	 */
	namespace(namespace) {
		if(typeof namespace !== 'string') {
			return [];
		}
		let processes = this.processes[namespace.toLowerCase()];
		return processes ? Object.values(processes) : [];
	}

	/**
	 * Checks whether a process with the given ID exists in the given namespace.
	 * 
	 * If the namespace is set to `null` (default) then it checks both user processes and backend processes.
	 * The default namespace for pre-defined processes is `backend`.
	 * 
	 * @param {string} id The process identifier
	 * @param {?string} [namespace=null] The namespace of the process
	 * @returns {boolean} 
	 */
	has(id, namespace = null) {
		return Boolean(this.get(id, namespace));
	}
	
	/**
	 * Retrieve the process with the given ID fron the given namespace.
	 * 
	 * If the namespace is set to `null` (default) then it retrieces from both (1) `user` processes and (2) `backend` processes
	 * with preference to user processes on conflict. The default namespace for pre-defined processes is `backend`.
	 * 
	 * @param {string} id The process identifier
	 * @param {?string} [namespace=null] The namespace of the process
	 * @returns {object} 
	 */
	get(id, namespace = null) {
		if (typeof id !== 'string') {
			return null;
		}

		// If no namespace is set, prefer the user namespace over backend namespace
		if (namespace === null) {
			return this.get(id, 'user') || this.get(id, 'backend');
		}

		id = id.toLowerCase();
		namespace = namespace.toLowerCase();
		if (this.processes[namespace]) {
			return this.processes[namespace][id] || null;
		}
		return null;
	}

	/**
	 * Removes a single process or a complete namespace from the registry.
	 * 
	 * If nothing is given, removes the namespace 'user'.
	 * If only a namespace is given, removes the whole namespace.
	 * If only a process is given, removes a process from the namespace `user`.
	 * If both parameters are given, removes a process from the given namespace.
	 * 
	 * Returns `true` on succes, `false` on failure.
	 * 
	 * @param {?string} [id=null] The process identifier
	 * @param {?string} [namespace="user"] The namespace, defaults to `user`
	 * @returns {boolean}
	 */
	remove(id = null, namespace = 'user') {
		if (typeof namespace !== 'string') {
			return false;
		}

		namespace = namespace.toLowerCase();
		if (this.processes[namespace]) {
			if (typeof id === 'string') {
				id = id.toLowerCase();
				if (this.processes[namespace][id]) {
					delete this.processes[namespace][id];
					if (Utils.size(this.processes[namespace]) === 0) {
						delete this.processes[namespace];
					}
					return true;
				}
			}
			else {
				delete this.processes[namespace];
				return true;
			}
		}

		return false;
	}

}

module.exports = ProcessRegistry;