# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0] - 2021-08-09

### Added

- New class (migrated over from JS Processgraphs): `ProcessRegistry`

## [1.3.0] - 2021-07-05

### Added

- New method in `Utils`: `hasText`
- New classes (migrated over from the Web Editor):
  - `ProcessParameter`
  - `ProcessSchema`
  - `ProcessDataType`

### Changed

- `npm run compat` was renamed to `npm run lint`

## [1.2.0] - 2020-09-03

### Added

- Support specifying a `keyPath` in `ProcessUtils.getCallbackParameters*()` methods to support `load_collection` filters.

## [1.1.1] - 2020-08-13

### Fixed

- `Utils.unique` did not work on arrays of objects

## [1.1.0] - 2020-08-13

### Added

- New methods in `Utils`:
  - `equals`
  - `mapObject`
  - `mapObjectValues`
  - `omitFromObject`
  - `pickFromObject`
  - `unique`
- New class `ProcessUtils`

## [1.0.0] - 2020-07-21

First release supporting openEO API 1.0.0.

## Prior releases

All prior releases have been documented in the [GitHub Releases](https://github.com/Open-EO/openeo-js-commons/releases).

[Unreleased]: <https://github.com/Open-EO/openeo-js-commons/compare/v1.4.0...HEAD>
[1.4.0]: <https://github.com/Open-EO/openeo-js-commons/compare/v1.3.0...v1.4.0>
[1.3.0]: <https://github.com/Open-EO/openeo-js-commons/compare/v1.2.0...v1.3.0>
[1.2.0]: <https://github.com/Open-EO/openeo-js-commons/compare/v1.1.1...v1.2.0>
[1.1.1]: <https://github.com/Open-EO/openeo-js-commons/compare/v1.1.0...v1.1.1>
[1.1.0]: <https://github.com/Open-EO/openeo-js-commons/compare/v1.0.0...v1.1.0>
[1.0.0]: <https://github.com/Open-EO/openeo-js-commons/compare/v1.0.0>
