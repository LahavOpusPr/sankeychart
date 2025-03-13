# Remediation Flow Chart PRD

## Product

### What (Overview)
A Sankey diagram visualization that tracks the flow of analyzed findings through their remediation lifecycle. The chart provides a clear view of how findings move through different phases, from initial analysis to final remediation, helping security teams understand their current remediation status and bottlenecks.

### Why (Motivation)
- Security teams need a clear visualization of their findings' remediation progress
- Current dashboards lack a comprehensive view of how findings move between different phases
- Teams need to identify bottlenecks in their remediation process
- Management needs to track the efficiency of the remediation process

### Objectives
1. Provide real-time visualization of findings flow through remediation phases
2. Enable teams to track findings volume in each phase
3. Identify bottlenecks in the remediation process
4. Show the relationship between SSVC decisions and remediation paths
5. Track findings that exit the remediation flow (e.g., approved exceptions)

### Constraints
1. Data must be updated in real-time without impacting system performance
2. Chart must handle varying volumes of findings
3. Must maintain visual clarity even with complex flow patterns
4. Must integrate with existing SSVC calculation data

### Design
#### Phase Structure
1. **Analyzed** (Entry Point)
   - Represents findings with completed SSVC calculations

2. **SSVC Decision Phases**
   - **Prioritized** (Act)
   - **Routine** (Attend)
   - **Monitor** (Track/Track*)

3. **Processing Phases**
   - **Queued**
     - **In Progress**
       - **Awaiting Validation**: Completed remediation pending verification
       - **Awaiting Approval**: Pending exception approval

4. **Final Phase**
   - **Remediated**: Verified fix

#### Flow Rules
1. Findings flow from Analyzed to respective SSVC decision phases based on backend data
2. SSVC decision phases lead to Queued status
3. Queued findings move to In Progress when remediation starts
4. From In Progress, findings can move to:
   - Awaiting Validation (when remediation is complete but needs verification)
   - Awaiting Approval (when exception is requested)
5. Awaiting Validation leads to Remediated upon verification
6. Findings with approved exceptions exit the flow

### Acceptance Criteria
1. Chart accurately displays current phase distribution based on backend data
2. Real-time updates when:
   - New findings are analyzed
   - Findings move between phases
   - Exceptions are approved
   - Remediations are validated
3. Flow visualization accurately represents:
   - Hierarchical phase structure
   - Current volume of findings in each phase
   - Transitions between phases
4. Interactive elements:
   - Phase toggling
   - Hover information
   - Flow value display

### Future Steps
1. Add historical trend analysis
2. Implement predictive flow analysis
3. Add time-in-phase tracking
4. Enable custom phase configuration
5. Add export capabilities for reporting

## Engineering

### Technical Objectives
1. **Data Integration**
   - Connect to backend database for real-time finding status
   - Implement efficient data transformation for Sankey diagram
   - Handle status change events
   - Ensure accurate reflection of backend data in flow visualization

2. **Performance**
   - Optimize data queries for large finding volumes
   - Implement efficient update mechanisms
   - Minimize browser resource usage

3. **Implementation**
   - Utilize existing React codebase
   - Leverage Plotly.js for Sankey visualization
   - Implement proper state management
   - Ensure type safety with TypeScript

4. **Code Structure**
   - Build on existing implementation in src/App.tsx
   - Maintain separation of concerns:
     - Data fetching/transformation
     - Visualization logic
     - State management
     - Event handling

5. **Testing Requirements**
   - Unit tests for data transformation
   - Integration tests for database connectivity
   - End-to-end tests for phase transitions
   - Performance tests for large data sets
   - Validation tests for data accuracy

6. **Monitoring**
   - Add performance metrics
   - Implement error tracking
   - Monitor data consistency
   - Track data flow accuracy
