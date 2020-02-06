# openeo-js-commons
A set of common JavaScript functionalities for [openEO](http://openeo.org).

[![Build Status](https://travis-ci.org/Open-EO/openeo-js-commons.svg?branch=master)](https://travis-ci.org/Open-EO/openeo-js-commons)

This library's version is **1.0.0-rc.1** and supports **openEO API version 1.0.x**. Legacy versions are available as releases.

## Features
- Converting responses from API version 0.4 to the latest API version is supported for:
    - Capabilities
    - Collections
    - Processes
    - Output Formats
    - Service Types
    - UDF Runtimes
- Back-end feature detection
- Validate, compare and prioritize version numbers (e.g. for well-known discovery)

**Note:** 
- Process graph parsing has been moved to [openeo-js-processgraphs](https://github.com/Open-EO/openeo-js-processgraphs).
- Support for migrating from API 0.3 to the latest API version has been dropped. Use the library in version 0.4 instead.

## Usage

To use it in a node environment use: `npm install @openeo/js-commons`

You can then require the parts of the library you want to use. For example: `const { MigrateProcesses } = require('@openeo/js-commons');`

In a web environment you can include the library as follows:

```html
<script src="https://cdn.jsdelivr.net/npm/@openeo/js-commons@1.0.0-rc.1/dist/main.min.js"></script>
```
<!-- When releasing a stable release, change the version to @1 instead of 1.0.0 to allow backward-compatible upgrades -->

More information can be found in the [**JS commons documentation**](https://open-eo.github.io/openeo-js-commons/1.0.0-rc.1/).