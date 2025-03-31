# Changelog

All notable changes to this project will be documented in this file.

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

## [2.0.0] - 2023-05-01

### Added
- Task dependency tracking between tasks
- Custom fields support for specialized tracking
- Enhanced search and filtering capabilities
- Cost optimization for AI assistant integration
- Batch processing to reduce premium tool call costs
- Improved terminal compatibility with better formatting fallbacks

### Changed
- Updated filtering system to handle priority, category, and keyword filters
- Improved task relationship visualization
- Enhanced batch operations interface

### Fixed
- Formatting issues in various terminal environments
- Performance issues with large task sets

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