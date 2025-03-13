import { useState } from 'react';
import Plot from 'react-plotly.js';
import { ToggleLeft, ToggleRight } from 'lucide-react';

function App() {
  const [hiddenPhases, setHiddenPhases] = useState<Set<number>>(new Set());

  const allNodes = {
    label: [
      'Analyzed', 
      'Prioritized',
      'Routine',
      'Monitor',
      'Queued',
      'In Progress',
      'Awaiting Approval',
      'Remediated',
      'Awaiting Validation'
    ],
    x: [0.1, 0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.9, 0.7],
    y: [0.5, 0.2, 0.5, 0.8, 0.3, 0.6, 0.8, 0.5, 0.5],
    pad: 20,
    thickness: 20,
    color: [
      '#3498DB',  // Analyzed
      '#E74C3C',  // Prioritized
      '#F39C12',  // Routine
      '#27AE60',  // Monitor
      '#95A5A6',  // Queued
      '#D35400',  // In Progress
      '#8E44AD',  // Awaiting Approval
      '#1ABC9C',  // Remediated
      '#16A085'   // Awaiting Validation
    ]
  };

  const allLinks = {
    source: [
      0, 0, 0,  // From Analyzed
      1, 1,  // From Prioritized
      2, 2,  // From Routine
      3, 3,  // From Monitor
      4, 5,  // From Queued, In Progress
      5,  // In Progress to Awaiting Approval
      5,  // In Progress to Awaiting Validation
      8  // Awaiting Validation to Remediated
    ],
    target: [
      1, 2, 3,  // From Analyzed to Priority/Routine/Monitor
      4, 5,  // From Prioritized to Queued/In Progress
      4, 6,  // From Routine to various states
      4, 6,  // From Monitor to various states
      5, 8,  // To In Progress, Awaiting Validation
      6,  // In Progress to Awaiting Approval
      8,  // In Progress to Awaiting Validation
      7   // Awaiting Validation to Remediated
    ],
    value: [
      5,    // Analyzed to Prioritized (5%)
      19,   // Analyzed to Routine (19% of remaining 95%)
      76,   // Analyzed to Monitor (76% of remaining 95%)
      2.5, 2.5,  // Prioritized flows
      9.5, 9.5,  // Routine flows
      38, 38,  // Monitor flows
      47, 23.5,  // Various flows
      10,  // In Progress to Awaiting Approval
      23.6,  // In Progress to Awaiting Validation
      47.1  // Awaiting Validation to Remediated
    ],
    color: [
      'rgba(231, 76, 60, 0.6)', 'rgba(243, 156, 18, 0.6)', 'rgba(39, 174, 96, 0.6)',  // Analyzed to Priority/Routine/Monitor
      'rgba(149, 165, 166, 0.6)', 'rgba(211, 84, 0, 0.6)',  // Prioritized flows
      'rgba(149, 165, 166, 0.6)', 'rgba(142, 68, 173, 0.6)',  // Routine flows
      'rgba(149, 165, 166, 0.6)', 'rgba(142, 68, 173, 0.6)',  // Monitor flows
      'rgba(211, 84, 0, 0.6)', 'rgba(22, 160, 133, 0.6)',  // Various flows
      'rgba(142, 68, 173, 0.6)',  // In Progress to Awaiting Approval
      'rgba(22, 160, 133, 0.6)',  // In Progress to Awaiting Validation
      'rgba(26, 188, 156, 0.6)'   // Awaiting Validation to Remediated
    ]
  };

  // Filter nodes and links based on hidden phases
  const filterData = () => {
    // Start with initially visible nodes (not hidden)
    let visibleNodes = new Set(
      Array.from({ length: allNodes.label.length }, (_, i) => i)
        .filter(i => !hiddenPhases.has(i))
    );

    // Create adjacency lists for both incoming and outgoing connections
    const incomingConnections = new Map();
    const outgoingConnections = new Map();

    // Initialize connection maps
    allNodes.label.forEach((_, i) => {
      incomingConnections.set(i, new Set());
      outgoingConnections.set(i, new Set());
    });

    // Build connection maps
    allLinks.source.forEach((source, i) => {
      const target = allLinks.target[i];
      outgoingConnections.get(source).add(target);
      incomingConnections.get(target).add(source);
    });

    // Function to check if a node is connected to the main flow
    const isConnected = (nodeId: number, visited: Set<number>): boolean => {
      if (visited.has(nodeId)) return false;
      visited.add(nodeId);

      // Base case: if this is either Total Findings (start) or Remediated (end)
      if ((nodeId === 0 || nodeId === 11) && visibleNodes.has(nodeId)) return true;

      // Check outgoing connections
      for (const target of outgoingConnections.get(nodeId)) {
        if (visibleNodes.has(target) && isConnected(target, visited)) {
          return true;
        }
      }

      // Check incoming connections
      for (const source of incomingConnections.get(nodeId)) {
        if (visibleNodes.has(source) && isConnected(source, visited)) {
          return true;
        }
      }

      return false;
    };

    // Iteratively remove disconnected nodes
    let changed = true;
    while (changed) {
      changed = false;
      const nodesToRemove = new Set<number>();

      // Check each visible node
      visibleNodes.forEach(nodeId => {
        if (!isConnected(nodeId, new Set())) {
          nodesToRemove.add(nodeId);
          changed = true;
        }
      });

      // Remove disconnected nodes
      nodesToRemove.forEach(nodeId => {
        visibleNodes.delete(nodeId);
      });
    }

    // Create a mapping from old indices to new indices
    const indexMap = new Map();
    let newIndex = 0;
    Array.from(visibleNodes).sort((a, b) => a - b).forEach(oldIndex => {
      indexMap.set(oldIndex, newIndex++);
    });

    // Filter nodes
    const filteredNodes = {
      label: allNodes.label.filter((_, i) => visibleNodes.has(i)),
      x: allNodes.x.filter((_, i) => visibleNodes.has(i)),
      y: allNodes.y.filter((_, i) => visibleNodes.has(i)),
      pad: allNodes.pad,
      thickness: allNodes.thickness,
      color: allNodes.color.filter((_, i) => visibleNodes.has(i))
    };

    // Filter and remap links
    const validLinks = allLinks.source.map((source, i) => ({
      source,
      target: allLinks.target[i],
      value: allLinks.value[i],
      color: allLinks.color[i]
    })).filter(link => 
      visibleNodes.has(link.source) && 
      visibleNodes.has(link.target)
    );

    // Calculate scaling factor for each source and target node
    const sourceValueSums = new Map();
    const targetValueSums = new Map();
    const originalSourceValueSums = new Map();
    const originalTargetValueSums = new Map();

    // Calculate original sums
    allLinks.source.forEach((source, i) => {
      originalSourceValueSums.set(source, (originalSourceValueSums.get(source) || 0) + allLinks.value[i]);
      const target = allLinks.target[i];
      originalTargetValueSums.set(target, (originalTargetValueSums.get(target) || 0) + allLinks.value[i]);
    });

    // Calculate sums for visible links
    validLinks.forEach(link => {
      sourceValueSums.set(link.source, (sourceValueSums.get(link.source) || 0) + link.value);
      targetValueSums.set(link.target, (targetValueSums.get(link.target) || 0) + link.value);
    });

    // Adjust the link values for visible nodes
    const adjustedLinks = validLinks.map(link => {
      const originalSourceSum = originalSourceValueSums.get(link.source);
      const newSourceSum = sourceValueSums.get(link.source);
      const scaleFactor = originalSourceSum / newSourceSum;

      // Adjust the link value based on the visible proportions
      const adjustedValue = link.value * scaleFactor;

      return {
        ...link,
        value: adjustedValue
      };
    });

    // Recalculate the link values to ensure they sum up to the total value of the source node
    const recalculatedLinks = adjustedLinks.map(link => {
      const totalVisibleValue = adjustedLinks
        .filter(l => l.source === link.source)
        .reduce((sum, l) => sum + l.value, 0);

      const proportion = link.value / totalVisibleValue;
      const recalculatedValue = originalSourceValueSums.get(link.source) * proportion;

      return {
        ...link,
        value: recalculatedValue
      };
    });

    const filteredLinks = {
      source: recalculatedLinks.map(link => indexMap.get(link.source)),
      target: recalculatedLinks.map(link => indexMap.get(link.target)),
      value: recalculatedLinks.map(link => link.value),
      color: recalculatedLinks.map(link => link.color)
    };

    return { nodes: filteredNodes, links: filteredLinks };
  };

  const togglePhase = (index: number) => {
    const newHiddenPhases = new Set(hiddenPhases);
    if (hiddenPhases.has(index)) {
      newHiddenPhases.delete(index);
    } else {
      newHiddenPhases.add(index);
    }
    setHiddenPhases(newHiddenPhases);
  };

  const { nodes, links } = filterData();

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Toggle Phases</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allNodes.label.map((label, index) => (
              <button
                key={index}
                onClick={() => togglePhase(index)}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  hiddenPhases.has(index)
                    ? 'bg-gray-100 text-gray-500'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                <span>{label}</span>
                {hiddenPhases.has(index) ? (
                  <ToggleLeft className="w-6 h-6" />
                ) : (
                  <ToggleRight className="w-6 h-6" />
                )}
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-4">
          <Plot
            data={[{
              type: 'sankey',
              orientation: 'h',
              node: nodes,
              link: links,
            }]}
            layout={{
              title: 'Remediation Flow',
              font: {
                size: 12,
                color: '#333'
              },
              paper_bgcolor: 'white',
              plot_bgcolor: 'white',
              width: 1200,
              height: 700,
              margin: {
                l: 50,
                r: 50,
                t: 50,
                b: 50
              }
            }}
            config={{
              displayModeBar: false,
              responsive: true
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;