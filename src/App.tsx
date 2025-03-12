import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { ToggleLeft, ToggleRight } from 'lucide-react';

function App() {
  const [hiddenPhases, setHiddenPhases] = useState<Set<number>>(new Set());

  const allNodes = {
    label: [
      'Total Findings', 
      'Analyzed', 
      'Not Analyzed',
      'Prioritized',
      'Routine',
      'Monitor',
      'Queued',
      'In Progress',
      'Awaiting Approval',
      'Exception Approved',
      'Remediated'
    ],
    x: [0.1, 0.3, 0.3, 0.5, 0.5, 0.5, 0.7, 0.7, 0.7, 0.7, 0.9],
    y: [0.5, 0.3, 0.7, 0.2, 0.5, 0.8, 0.3, 0.6, 0.8, 0.9, 0.5],
    pad: 20,
    thickness: 20,
    color: [
      '#2C3E50',  // Total Findings - Dark Blue Gray
      '#3498DB',  // Analyzed - Blue
      '#9B59B6',  // Not Analyzed - Purple
      '#E74C3C',  // Prioritized - Red
      '#F39C12',  // Routine - Orange
      '#27AE60',  // Monitor - Green
      '#95A5A6',  // Queued - Gray
      '#D35400',  // In Progress - Dark Orange
      '#8E44AD',  // Awaiting Approval - Dark Purple
      '#2980B9',  // Exception Approved - Dark Blue
      '#1ABC9C'   // Remediated - Turquoise
    ]
  };

  const allLinks = {
    source: [
      0, 0,  // From Total Findings
      1, 1, 1,  // From Analyzed
      2, 2, 2,  // From Not Analyzed
      3, 3,  // From Prioritized
      4, 4, 4,  // From Routine
      5, 5, 5,  // From Monitor
      8, 6, 7  // From various states to final states
    ],
    target: [
      1, 2,  // To Analyzed/Not Analyzed
      3, 4, 5,  // From Analyzed to Priority/Routine/Monitor
      3, 4, 5,  // From Not Analyzed to Priority/Routine/Monitor
      6, 7,  // From Prioritized to Queued/In Progress
      6, 8, 9,  // From Routine to various states
      6, 8, 9,  // From Monitor to various states
      9, 7, 10  // Final flows
    ],
    value: [
      95, 5,  // Total Findings distribution
      0.095, 4.655, 90.25,  // Analyzed distribution
      0.005, 0.245, 4.75,  // Not Analyzed distribution
      0.05, 0.05,  // Prioritized flows
      2, 2, 0.9,  // Routine flows
      45, 45, 5,  // Monitor flows
      3, 47, 47.1  // Final flows
    ],
    color: [
      'rgba(52, 152, 219, 0.6)', 'rgba(155, 89, 182, 0.6)',  // Total to Analyzed/Not Analyzed
      'rgba(231, 76, 60, 0.6)', 'rgba(243, 156, 18, 0.6)', 'rgba(39, 174, 96, 0.6)',  // Analyzed to Priority/Routine/Monitor
      'rgba(231, 76, 60, 0.6)', 'rgba(243, 156, 18, 0.6)', 'rgba(39, 174, 96, 0.6)',  // Not Analyzed to Priority/Routine/Monitor
      'rgba(149, 165, 166, 0.6)', 'rgba(211, 84, 0, 0.6)',  // Prioritized flows
      'rgba(149, 165, 166, 0.6)', 'rgba(142, 68, 173, 0.6)', 'rgba(41, 128, 185, 0.6)',  // Routine flows
      'rgba(149, 165, 166, 0.6)', 'rgba(142, 68, 173, 0.6)', 'rgba(41, 128, 185, 0.6)',  // Monitor flows
      'rgba(41, 128, 185, 0.6)', 'rgba(211, 84, 0, 0.6)', 'rgba(26, 188, 156, 0.6)'   // Final flows
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

      // Base case: if this is the final node (Remediated)
      if (nodeId === 10 && visibleNodes.has(nodeId)) return true;

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

    // Calculate scaling factor for each source node
    const sourceValueSums = new Map();
    const originalSourceValueSums = new Map();

    // Calculate original sums
    allLinks.source.forEach((source, i) => {
      originalSourceValueSums.set(source, (originalSourceValueSums.get(source) || 0) + allLinks.value[i]);
    });

    // Calculate sums for visible links
    validLinks.forEach(link => {
      sourceValueSums.set(link.source, (sourceValueSums.get(link.source) || 0) + link.value);
    });

    // Scale the values
    const scaledLinks = validLinks.map(link => {
      const originalSum = originalSourceValueSums.get(link.source);
      const newSum = sourceValueSums.get(link.source);
      const scaleFactor = originalSum / newSum;
      
      return {
        ...link,
        value: link.value * scaleFactor
      };
    });

    const filteredLinks = {
      source: scaledLinks.map(link => indexMap.get(link.source)),
      target: scaledLinks.map(link => indexMap.get(link.target)),
      value: scaledLinks.map(link => link.value),
      color: scaledLinks.map(link => link.color)
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