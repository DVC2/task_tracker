# Developer Reference

This directory contains technical reference documentation for TaskTracker developers.

## Available References

- [CLI Reference](./cli-reference.md) - Complete reference for all TaskTracker commands and options
- [Optimization Guide](./OPTIMIZATION.md) - Performance optimization guidelines and benchmarks

## Developer Documentation

For more detailed developer documentation, see the [dev-docs](../dev-docs) directory:

- [Architecture Documentation](../dev-docs/ARCHITECTURE.md) - Overview of TaskTracker architecture
- [Performance Optimizations](../dev-docs/OPTIMIZATIONS.md) - Detailed performance optimizations documentation

## Contributing

If you're interested in contributing to TaskTracker, please first read through these reference documents to understand the project's architecture and design philosophy.

We welcome contributions in:

- New command implementations
- Performance optimizations
- Documentation improvements
- Test coverage enhancements

## Best Practices

When developing for TaskTracker:

1. Maintain modular architecture with the command registry pattern
2. Add comprehensive tests for new functionality
3. Ensure backward compatibility with previous versions
4. Document all new commands and features
5. Consider performance implications for large task collections 