# Changelog

All notable changes to this project will be documented in this file.

## [1.5.0] - 2025-03-29

### Added
- Implement file change tracking without Git dependency (#35)
- Add file timestamp-based tracking for non-Git environments (#35)
- Add command aliases for improved user experience (#39)
- Add technical debt tracking category (#19)
- Add task prioritization and effort estimation (#21)
- Add code health metrics for technical debt tracking (#22)
- Add global npm installation package (#23)
- Create VSCode extension for TaskTracker (#24)
- Add JetBrains IDE integration (#25)
- Create automated onboarding process (#26)
- Implement auto-detection of project type (#27)
- Add checklist support within tasks (#32)
- Implement more robust chalk-like fallback mechanism (#39)
- Add periodic cleanup of stale file hash entries (#39)
- Add performance optimizations for large projects (#39)

### Fixed
- Fix chalk library compatibility issues with fallback formatting (#35, #39)
- Improve error handling for non-Git repositories (#35, #39)
- Make command syntax more consistent (e.g., 'addfile' → 'add-file') (#35)
- Enhance documentation for commands and features (#35, #39)
- Improve file tracking performance with filtering and limits (#39)
- Add better error messages for Git command failures (#39)

### Changed
- Refactor file tracking to be more efficient (#39)
- Standardize command names and parameters (#39)
- Improve help documentation with better examples (#39)
- Technical debt template for tracking complexity (#20)
- Reorganize project directory structure to follow best practices (#34)

## [1.2.0] - 2025-03-28

### Changed
- Clean up documentation duplication and standardize naming (#18)

## [1.1.0] - 2025-03-28

### Added
- Create detailed documentation for import command (#11)
- Add global installation option (#13)
- Create user documentation (#15)
- TaskTracker Experience Improvements (#16)
- Add color support to terminal output (#17)

### Changed
- Add test suite (#6)
- Add unit tests for task commands (#10)

### Fixed
- Fix bug in list command (#2)
- Improve error handling (#14)

## [0.4.0] - 2025-03-28

### Added
- Implement interactive add command (#3)

### Fixed
- Fix table formatting in task list output (#12)

## [0.3.0] - 2025-03-28

### Added
- Implement release command for version management (#5)
- Implement snapshot command (#9)

## [0.2.0] - 2025-03-28

### Added
- Create package.json for dependency management (#4)
- Create cursor rules for TaskTracker integration (#7)
- Add batch import functionality for multiple tasks (#8)

### Changed
- Test functionality (#1)

