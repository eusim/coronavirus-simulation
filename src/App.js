import React, { useEffect, useState, useRef } from "react";

import styles from "./App.module.css";
import Graph from "./Graph";
import LineChart from "./LineChart";
import SimulationSettings from "./SimulationSettings";
import { SICK, RECOVERED, DEAD } from "./constants";
import { useInterval, randomChoice } from "./utils";
import { nextSimulationTick, getInitialGraph } from "./simulation";

const INITIAL_SIMULATION_STATE = {
  tick: 0,
  agentsPerHouse: 9,
  houses: 42,
  initialSickAgents: 4,
};

// Setup initial graph containing venues and agents
const INITIAL_GRAPH = getInitialGraph(INITIAL_SIMULATION_STATE);

function App() {
  const [simulationState, setSimulationState] = useState(
    INITIAL_SIMULATION_STATE
  );
  const [nodes, setNodes] = useState(INITIAL_GRAPH.nodes);
  const [edges, setEdges] = useState(INITIAL_GRAPH.edges);
  const [historicalSickCount, setHistoricalSickCount] = useState([]);
  const [historicalRecoveredCount, setHistoricalRecoveredCount] = useState([]);
  const [historicalDeadCount, setHistoricalDeadCount] = useState([]);
  const [loading, setLoading] = useState(true);

  const graphRef = useRef(null);

  useInterval(() => {
    if (loading) {
      return;
    }

    const { nodes: _nodes, edges: _edges, state } = nextSimulationTick(
      simulationState,
      nodes,
      edges
    );

    setSimulationState(state);

    // Setup for graph in the bottom right
    setHistoricalSickCount(
      historicalSickCount.concat(
        nodes.filter(({ state }) => state === SICK).length
      )
    );

    setHistoricalRecoveredCount(
      historicalRecoveredCount.concat(
        nodes.filter(({ state }) => state === RECOVERED).length
      )
    );

    setHistoricalDeadCount(
      historicalDeadCount.concat(
        nodes.filter(({ state }) => state === DEAD).length
      )
    );
  }, 1000);

  useEffect(() => {
    setLoading(false);
  }, [loading]);


  // Quarantine
  const onNodeClick = (nodeId) => {
    return () => {
      const node = nodes.find(({ id }) => nodeId === id);
      if (node.type !== "venue") {
        return;
      }
      node.locked = !node.locked;
    };
  };

  const onSettingChange = (key) => (event) => {
    setSimulationState({ ...simulationState, [key]: event.target.value });
  };

  const onRestartButtonClick = () => {
    const { nodes, edges } = getInitialGraph(simulationState);
    setLoading(true);
    setNodes(nodes);
    setEdges(edges);
    setHistoricalDeadCount([]);
    setHistoricalRecoveredCount([]);
    setHistoricalSickCount([]);
    setSimulationState({ ...simulationState, tick: 0 });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>What happens in Europe if we ... ?</h3>
        <h2>An experiment to analyse how a virus spreads over Europe</h2>
      </div>
      <div className={styles.simulation}>
        <div className={styles.samples}>
          <span className={styles.sampleSusceptible}>Susceptible</span>
          <span className={styles.sampleInfected}>Infected</span>
          <span className={styles.sampleRecovered}>Recovered</span>
          <span className={styles.sampleDead}>Deceased</span>
          <i>Click on a country to lock it down (quarantine)</i>
        </div>
        {!loading && (
          <Graph
            width={
              Math.round(
                nodes.filter(({ type }) => type === "venue").length / 6
              ) * 110
            }
            height={700}
            tick={simulationState.tick}
            nodes={nodes}
            edges={edges}
            onNodeClick={onNodeClick}
            ref={graphRef}
          />
        )}
      </div>
      <div className={styles.section}>
        <div className={styles.stats}>
          <h3>Stats</h3>
          <div className={styles.population}>
            POPULATION: {nodes.filter(({ type }) => type === "agent").length}{" "}
            <br />
            DEAD: {nodes.filter(({ state }) => state === DEAD).length} <br />
            RECOVERED: {
              nodes.filter(({ state }) => state === RECOVERED).length
            }{" "}
            <br />
            SICK: {nodes.filter(({ state }) => state === SICK).length} <br />
          </div>
          <LineChart
            width={300}
            height={270}
            data={[
              { color: "red", points: historicalSickCount },
              { color: "green", points: historicalRecoveredCount },
              { color: "black", points: historicalDeadCount },
            ]}
          />
        </div>
        <div className={styles.simulationSettings}>
          <h3>Settings</h3>
          <div className={styles.simulationInfo}>
            Click on a country on the map to make it quarantined.
          </div>
          <SimulationSettings
            simulationState={simulationState}
            onSettingChange={onSettingChange}
            onRestartButtonClick={onRestartButtonClick}
          />
        </div>
        
      </div>
      <div className={styles.pageInfo}>
      <ins
          className="adsbygoogle"
          style={{ display: 'block', textAlign: 'center' }}
          data-ad-layout="in-article"
          data-ad-format="fluid"
          data-ad-client="ca-pub-5587173855104127"
          data-ad-slot="8487596319"
        ></ins>
        <div className={styles.section}>
          <h1>What is this?</h1>
          <p>
            Imagine you are ruling over the European Union and can also influence how a sickness like COVID-19 behaves in a population like the European Union. What would you do if you were chief of the EU? Would you lock it down? Would you set out laws to make people wear masks? Explore your ability to manage the EU by changing the sliders above and watch how the sickness spreads over time. 😊
          </p>
          <p>
            This is a direct result of the euvsvirus.org Hackathon 2020 based on this whitepaper: <a href="https://devpost.com/software/political-policies-effect-on-covid-19-spread-inside-the-eu-uamhdv">Political policies effect on COVID-19 spread inside the EU</a>
          </p>
          <h1>How does it work?</h1>
          <p>
            Every citizen starts with the `SUSCEPTIBLE` state in the simulation, because almost everybody can get sick if she or he has contact with a `SICK` citizen. However, there are some people who are immune or resistant by nature.
            Some of the citizen are in the `SICK` state at the very beginning, because they were abroad. Over the time, sick citizen spread the virus to the
            rest of the population and the other citizen get sick as well based on the "basic reproduction number". After the infection, the now `SICK` citizen switch into a recovered or a dead state based on some probabilistic values.
          </p>
          <p>
            In the model, we have four different states of each EU citizen. The first state is
            <i> SUSCEPTIBLE</i>, second one is <i> SICK</i>, and the last one is
            <i> RECOVERED</i>. We have also a <i> DEAD</i> state in this
            simulation, because unfortunately some people die because of COVID-19.
          </p>
          <p>
            The probabilistic values are defined in a Markov-chain concept called Markov graph. Markov chain is a stochastic model to describe a sequence of possible events that can occur in the future.
          </p>
          <p>
            We're using a Markov graph to define a probabilistic transition. We
            can simply say that markov chain is a graph of all the possible
            state transitions of an individual node.
          </p>
          <h1>I would like to discover more:</h1>
          <p>
            This is an MIT-licensed open-source project, you can find the source
            code on github. Feel free to copy, use or modify it for your own
            simulations.
          </p>
          <p>
            Created by<br />
            <a href="https://twitter.com/fthrkl">Fatih Erikli</a>'s
            <a href="https://twitter.com/michel_mke">Michel Make</a>
            <a href="https://twitter.com/rscircus">Roland Siegbert</a>
          </p>
          <p style={{ marginBottom: "4em" }}>
            Stay safe! <br />{" "}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
