# SGAD Autonomy Budget

## Allowed Autonomous Changes

- Modify files inside `variants/sgad`.
- Implement the seed project with Node standard library APIs.
- Add tests using built-in `node:test`.
- Add SGAD and OpenSpec documents required by the experiment.

## Disallowed Changes

- Do not modify sibling variants.
- Do not modify evaluator files.
- Do not add package dependencies.
- Do not call external notification services from tests or default runtime.

## Escalation Points

- Persistent storage requirements.
- Real authentication or authorization integration.
- Production notifier integration.
- Cross-process SLA reminder de-duplication.

## Budget Decision

The implementation stays within the autonomous budget because it is confined to the SGAD variant, uses zero external dependencies, and provides executable verification for the required behaviors.
