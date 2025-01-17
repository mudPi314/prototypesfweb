import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import {
  Panel,
  PanelGroup,
  PanelResizeHandle
} from "react-resizable-panels"
import logo from './assets/logo.svg'

// Sample blog posts data
const posts = [
  {
    name: "An Introduction to Prototype",
    content: `Welcome to PrototypeSF, where we're building a rare combo of competence mixed with genuine creative exploration.

Prototype is engineers who appreciate aesthetics, designers who get excited about systems thinking, and a group where collaboration and contribution nets out as positive personal sum gain.

We've put thought into creating comfortable, organic shared workspaces that facilitate both focused deep work and natural collaboration. The kind of environment where good ideas flow naturally.

We're looking for housemates who:

- Care deeply about both building and connecting
- Bring their own unique perspectives to the collective
- Actually ship things
- Know how to both give and receive signal resiliently

If you're the type of person who finds equal satisfaction in optimizing systems and debating modal realism at 2am, you might just fit right in.

This is an experiment in collaborative living where everyone levels up together. High agency, low drama/(high EQ), maximum potential for interesting objects to emerge.`,
    xLink: "https://twitter.com/prototypesf",
    specialLinkName: null,
    specialLink: null,
    timestamp: "2025-01-15"
  },
  {
    name: "Embracing the Softness of Software",
    content: "Any sufficiently advanced technology is indistinguishable from magic. We're a community of creators who are passionate about building things that are useful, beautiful, and fun.",
    xLink: "https://twitter.com/prototypesf",
    specialLinkName: null,
    specialLink: null,
    timestamp: "2025-01-15"
  }
]

// Sample data - you can modify this
const data = {
  nodes: [
    { id: "Prototype", group: 3, type: "organization" },
    { id: "Luka Arnold", group: 2, type: "person" },
    { id: "Verda Korz", group: 2, type: "person" },
    { id: "Anton Balitskyi", group: 2, type: "person" },
    { id: "Jaivin Wylde", group: 2, type: "person" }
  ],
  links: [
    { source: "Luka Arnold", target: "Prototype" },
    { source: "Verda Korz", target: "Prototype" },
    { source: "Anton Balitskyi", target: "Prototype" },
    { source: "Jaivin Wylde", target: "Prototype" }
  ]
}

const calculateNodeSize = (nodeId) => {
  // Count connections for this node
  const connectionCount = data.links.filter(
    link => link.source.id === nodeId || link.target.id === nodeId
  ).length

  // Much more dramatic size difference
  // Tiny base size (3), much larger multiplier (15)
  const size = 6 + Math.log2(connectionCount + 1) * 2
  
  return size
}

function App() {
  const svgRef = useRef(null)
  const [isVertical, setIsVertical] = useState(window.innerWidth < 768)
  // Add state for panel size
  const [mobileSize, setMobileSize] = useState(window.innerWidth)

  // Update resize listener to also track width for mobile
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setIsVertical(width < 768)
      setMobileSize(width)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!svgRef.current) return

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove()

    // Get dimensions from container
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", "100%")
      .attr("height", "100%")

    // Add grid pattern
    const defs = svg.append("defs")
    const pattern = defs.append("pattern")
      .attr("id", "grid")
      .attr("width", 30)
      .attr("height", 30)
      .attr("patternUnits", "userSpaceOnUse")

    pattern.append("path")
      .attr("d", "M 30 0 L 0 0 0 30")
      .style("fill", "none")
      .style("stroke", "#efefef")
      .style("stroke-width", "1")
      .attr("vector-effect", "non-scaling-stroke")

    // Create a container group for zoom
    const g = svg.append("g")

    // Add grid background to the zoom group
    g.append("rect")
      .attr("width", width * 4)
      .attr("height", height * 4)
      .attr("x", -width * 1.5)
      .attr("y", -height * 1.5)
      .style("fill", "url(#grid)")

    // Add zoom behavior with initial transform
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
      })

    // Set initial zoom and center
    const initialTransform = d3.zoomIdentity
      .translate(width/2, height/2)
      .scale(1.5)
    
    svg.call(zoom)
      .call(zoom.transform, initialTransform)

    // Create the links with thinner, lighter lines
    const links = g.append("g")
      .selectAll("line")
      .data(data.links)
      .join("line")
      .style("stroke", "#cccccc")
      .style("stroke-opacity", 0.6)
      .style("stroke-width", 0.5)

    // Create smaller nodes
    const nodes = g.append("g")
      .selectAll("path")
      .data(data.nodes)
      .join("path")
      .attr("d", d => {
        const size = calculateNodeSize(d.id);
        if (d.type === "organization") {
          // Create rounded square path
          const baseSize = calculateNodeSize(d.id);
          const size = baseSize * 2.5; // Make squares larger but proportional
          const cornerRadius = size * 0.4; // 40% corner rounding
          
          // Create a perfect square with rounded corners
          const rectHeight = size;
          const rectWidth = size*0.23;
          return `
            M${-rectWidth/2},${-rectHeight/2}
            h${rectWidth}
            a${cornerRadius},${cornerRadius} 0 0 1 ${cornerRadius},${cornerRadius}
            v${rectHeight - 2*cornerRadius}
            a${cornerRadius},${cornerRadius} 0 0 1 ${-cornerRadius},${cornerRadius}
            h${-rectWidth}
            a${cornerRadius},${cornerRadius} 0 0 1 ${-cornerRadius},${-cornerRadius}
            v${-(rectHeight - 2*cornerRadius)}
            a${cornerRadius},${cornerRadius} 0 0 1 ${cornerRadius},${-cornerRadius}
            z
          `;
        } else {
          // Create circle path
          return `
            M 0,${-size}
            a ${size},${size} 0 1,1 0,${2*size}
            a ${size},${size} 0 1,1 0,${-2*size}
          `;
        }
      })
      .style("fill", d => d.type === "organization" ? "#ff83fa" : "#5179f1")

    // Add smaller labels
    const labels = g.append("g")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
      .text(d => d.id)
      .attr("font-size", "10px")
      .attr("text-anchor", "middle")
      .attr("dy", d => {
        if (d.type === "organization") {
          const baseSize = calculateNodeSize(d.id);
          return baseSize * 2.5 * 0.23 + 20; // Adjust label position for rectangular shape
        }
        return Math.min(4 + calculateNodeSize(d.id) * 0.5, 8) + 12;
      })
      .style("pointer-events", "none")
      .style("user-select", "none")
      .style("fill", "#333333")

    // Modify force simulation for more organic layout
    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id(d => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("x", d3.forceX(0).strength(0.1))  // Center force in X direction
      .force("y", d3.forceY(0).strength(0.1))  // Center force in Y direction
      .force("collision", d3.forceCollide().radius(d => Math.min(4 + calculateNodeSize(d.id) * 0.5, 8) + 20))

    // Update positions on tick
    simulation.on("tick", () => {
      links
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)

      nodes
        .attr("transform", d => `translate(${d.x},${d.y})`)

      labels
        .attr("x", d => d.x)
        .attr("y", d => d.y)
    })

    // Drag behavior
    const drag = d3.drag()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on("drag", (event, d) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      })

    nodes.call(drag)

    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [])

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      background: '#fff',
      overflow: 'hidden'
    }}>
      <PanelGroup 
        direction={isVertical ? "vertical" : "horizontal"} 
        style={{ width: '100%', height: '100%' }}
      >
        <Panel 
          defaultSize={isVertical ? 70 : 40} 
          minSize={isVertical ? 20 : 30}
        >
          <div style={{
            height: '100%',
            background: '#fff',
            overflowY: 'auto', // Allow scroll only in blog posts
            padding: '0rem',
          }}>
            <div style={{ 
              borderBottom: '1px solid #ddd',
              paddingTop: '1.5rem',
              paddingBottom: '1rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '100px'
            }}>
              <img 
                src={logo}
                alt="Prototype SF"
                style={{
                  width: '260px',
                  margin: 0
                }}
              />
            </div>
            {posts.map((post, index) => (
              <div key={index}>
                <div style={{ marginBottom: '3rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                  }}>
                    <h2 style={{ 
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#000',
                      margin: 0
                    }}>
                      {post.name}
                    </h2>
                    <span style={{
                      fontSize: '14px',
                      color: '#ccc'
                    }}>
                      {new Date(post.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ 
                    fontSize: '15.5px',
                    lineHeight: '1.4',
                    color: '#333',
                    marginBottom: '1rem',
                    whiteSpace: 'pre-line'
                  }}>
                    {post.content}
                  </p>
                  {post.specialLink && (
                    <button style={{
                      padding: '6px 12px',
                      border: '1px solid #666',
                      borderRadius: '4px',
                      background: 'none',
                      fontSize: '13px',
                      cursor: 'pointer',
                      color: '#666'
                    }}>
                      {post.specialLinkName}
                    </button>
                  )}
                </div>
                {index < posts.length - 1 && (
                  <div style={{ 
                    width: '100%', 
                    height: '1px', 
                    background: '#ddd', 
                    margin: '2rem 0' 
                  }} />
                )}
              </div>
            ))}
          </div>
        </Panel>
        
        <PanelResizeHandle style={{
          width: isVertical ? '100%' : '1px',
          height: isVertical ? '1px' : '100%',
          background: '#ddd',
          cursor: isVertical ? 'row-resize' : 'col-resize'
        }} />
        
        <Panel 
          defaultSize={60} 
          style={{ 
            background: '#fff', 
            minWidth: isVertical ? 'auto' : '400px'
          }}
        >
          <div style={{
            padding: '0.9rem',
            height: '100%',
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            background: '#f5f5f5'
          }}>
            <div 
              style={{
                flexGrow: 1,
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #dfdfdf',
                background: '#fff'
              }}
            >
              <svg 
                ref={svgRef}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  touchAction: 'none'
                }}
              />
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  )
}

export default App
