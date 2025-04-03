# Changelog

## [2.0.0] - 2023-08-15

### Major Changes
- Complete architectural refactoring to modular design
- Introduced command registry pattern for better extensibility
- Removed monolithic script in favor of dedicated modules
- Improved performance and reduced memory usage

### Added
- New core service modules for better separation of concerns
- Comprehensive test suite with unit, integration, and performance tests
- Command aliasing system with consistent interface
- Performance monitoring and optimization framework
- Documentation for architectural patterns and extension points

### Changed
- All commands have been extracted to individual modules
- Entry point scripts now use command registry for dispatch
- Improved error handling across all commands
- Better terminal output formatting with consistent styles
- Configuration system is now more modular and extensible

### Fixed
- Many edge cases and error conditions are now properly handled
- Improved compatibility with various terminal environments
- Better handling of corrupted or missing data files
- Command validation is now more robust

### Documentation
- Added architecture documentation for developers
- Updated README with new features and usage patterns
- Added optimization documentation with performance metrics
- Improved inline code documentation

## [1.5.0] - 2023-05-20

### Added
- New `ignore` command for managing ignored files
- Support for custom task views and layouts
- Improved Git integration 
- Added release management commands

### Changed
- Enhanced task filtering system
- Improved performance for large task collections
- Better terminal compatibility

### Fixed
- Issue with archiving tasks containing special characters
- Bug in file change detection with certain Git configurations
- Problems with configuration saving in some environments

## [1.4.2] - 2023-04-15

### Fixed
- Critical bug in task update command
- Issue with multi-line task descriptions
- Path handling on Windows systems

## [1.4.1] - 2023-04-10

### Fixed
- Bug in file tracking when files contained spaces
- Configuration loading issue on first run
- Task list sorting inconsistencies

## [1.4.0] - 2023-04-03

### Features

- Fixed terminal output formatting issues for task titles and better table display
- Implemented numbered selection for task attributes in interactive mode
- Added AI context generation command (`tt context`) for better AI integration
- Added automatic file linking to tasks based on current open file
- Improved security with input validation, secure file permissions, and sanitization
- Added security verification script (`tt-security`) to check for common security issues

### Bug Fixes

- Fixed spacing issues in task titles that were causing display problems
- Fixed ASCII art banner to properly display the complete logo
- Fixed file operations to handle missing directories and invalid files gracefully
- Improved error handling and validation across commands

## [1.3.0] - 2023-03-15

### Added
- Support for task comments
- File linking to tasks
- Basic search functionality
- JSON output option for automation

### Fixed
- Various bugs and edge cases

## [1.2.0] - 2023-02-22

### Added
- Configuration management
- Custom task statuses
- Priority levels for tasks

## [1.1.0] - 2023-02-10

### Added
- Task updating functionality
- Improved listing with filtering
- Basic file change tracking

## [1.0.0] - 2023-02-01

### Added
- Initial release of TaskTracker
- Basic task creation and listing
- Simple CLI interface

## [2.1.2] - 2024-03-31

### Fixed
- Fixed viewTask function to properly display task status and details
- Added missing utility functions for task display (getStatusEmoji, getPriorityLabel)
- Fixed colorize function to work with the new directory structure
- Added proper module imports in integration tests

## [2.1.1] - 2024-03-31

### Fixed
- Batch command flag handling in any position (especially `--silent`)
- Task dependency tracking in the reorganized directory structure
- File linking parameter parsing to prevent flags from being treated as files
- Added verification script to detect and fix missing files post-update
- Improved terminal compatibility with option to suppress specific warnings

## [2.1.0] - 2024-03-31

### Added
- Claude agent integration with special templates for cost optimization
- Batch commands and templates for Claude integration
- Enhanced security checks for sensitive information
- Comprehensive update guide for users
- New test suite with unit, integration, and security tests

### Changed
- Reorganized directory structure for better maintainability
  - Core functionality moved to `lib/core/`
  - Reporting tools moved to `lib/reporting/` 
  - Integration code moved to `lib/integration/`
- Enhanced documentation with improved organization
- Updated `.taskignore` patterns for better security
- Reduced premium tool call costs with batch processing

### Fixed
- Script compatibility with reorganized directories
- Backward compatibility with older versions

## [2.0.1] - 2023-06-15

### Added
- Burndown chart generator with ASCII, HTML, and JSON outputs
- Plain text mode (`--plain` flag) for better terminal compatibility
- Adaptive layouts that automatically adjust to terminal dimensions
- Enhanced Cursor IDE integration with PR generation and context switching
- Task comment templates for standardized code documentation
- Pagination support for large projects (`--page=N`, `--page-size=N`)
- Improved search and filtering capabilities
- Performance optimization for projects with hundreds of tasks

### Changed
- Improved terminal compatibility and formatting
- Enhanced visualization of task relationships
- Better performance for large task sets
- Optimized memory usage and caching

### Fixed
- Terminal compatibility issues in various environments
- Performance bottlenecks when dealing with large task sets
- Issues with task dependency visualization

## [1.5.0] - 2023-03-15

### Added
- Git integration for automatic change tracking
- Automated changelog generation
- Statistical reporting and project visualization
- AI-friendly context generation

### Changed
- Improved file change detection
- Enhanced task status tracking

## [1.0.0] - 2023-01-10

### Added
- Initial release of TaskTracker
- Basic task tracking functionality
- File change detection
- Simple reporting features

## [Unreleased]
### Added
- Improved JSON parsing error handling to prevent test failures
- Enhanced error messages for JSON parsing failures with more context
- Added support for handling circular references in JSON serialization
- Created dedicated test suite for JSON parsing functionality
- Fixed unit tests to handle JSON parsing errors gracefully 