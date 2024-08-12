# @openeo/js-commons

A set of common JavaScript functionalities for [openEO](http://openeo.org).

The [master branch](https://github.com/Open-EO/openeo-api/tree/master) is the 'stable' version of library, which is currently version **1.5.0**.
The [draft branch](https://github.com/Open-EO/openeo-api/tree/draft) is where active development takes place.

![Dependencies](https://img.shields.io/librariesio/release/npm/@openeo/js-commons)
![Minified Size](https://img.shields.io/bundlephobia/min/@openeo/js-commons/1.5.0)
![Minzipped Size](https://img.shields.io/bundlephobia/minzip/@openeo/js-commons/1.5.0)
![Supported API Versions](https://img.shields.io/github/package-json/apiVersions/Open-Eo/openeo-js-commons/master)
![JS Commons Tests](https://github.com/Open-EO/openeo-js-commons/workflows/JS%20Commons%20Tests/badge.svg)

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
- Process specification parsing utilities
- Other Utils

## Usage

To use it in a node environment use: `npm install @openeo/js-commons`

You can then require the parts of the library you want to use. For example: `const { MigrateProcesses } = require('@openeo/js-commons');`

In a web environment you can include the library as follows:

```html
<script src="https://cdn.jsdelivr.net/npm/@openeo/js-commons@1/dist/main.min.js"></script>
```

More information can be found in the [**JS commons documentation**](https://open-eo.github.io/openeo-js-commons/1.5.0/).
