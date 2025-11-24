import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styled from "styled-components";
import Grid from "./Grid";
import PathPoint from "./PathPoint";
import ConnectionStatus from "./ConnectionStatus";
import MessageStats from "./MessageStats";
import { useWebSocket } from "../hooks/useWebSocket";

const Container = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const Title = styled.h1`
  color: white;
  font-size: 2.5rem;
  font-weight: 300;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.2rem;
  margin: 0;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
`;

const VisualizationArea = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 20px;
`;

const ParticleBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
`;

interface KafkaMessage {
  topic: string;
  partition: number;
  offset: string;
  key?: string;
  value: string;
  timestamp: string;
}

interface PathData {
  x: number;
  y: number;
  m: number;
  n: number;
  result?: number;
  timestamp: number;
}

const PathVisualization: React.FC = () => {
  const [messages, setMessages] = useState<KafkaMessage[]>([]);
  const [pathData, setPathData] = useState<PathData[]>([]);
  const [currentGrid, setCurrentGrid] = useState<{
    m: number;
    n: number;
  } | null>(null);
  const [animatingPaths, setAnimatingPaths] = useState<PathData[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { connectionStatus, messageCount } = useWebSocket(
    "ws://localhost:8080",
    (message: KafkaMessage) => {
      setMessages((prev) => [...prev.slice(-99), message]); // Keep last 100 messages

      try {
        const data = JSON.parse(message.value);
        if (
          data.x !== undefined &&
          data.y !== undefined &&
          data.m !== undefined &&
          data.n !== undefined
        ) {
          const pathPoint: PathData = {
            x: data.x,
            y: data.y,
            m: data.m,
            n: data.n,
            result: data.result,
            timestamp: Date.now(),
          };

          setPathData((prev) => [...prev.slice(-49), pathPoint]); // Keep last 50 path points
          setCurrentGrid({ m: data.m, n: data.n });
          setAnimatingPaths((prev) => [...prev, pathPoint]);

          // Remove from animating paths after animation completes
          setTimeout(() => {
            setAnimatingPaths((prev) =>
              prev.filter((p) => p.timestamp !== pathPoint.timestamp)
            );
          }, 3000);
        }
      } catch (error) {
        console.log("Message is not path data:", message.value);
      }
    }
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Generate background particles
  const particles = Array.from({ length: 50 }, (_, i) => (
    <motion.div
      key={i}
      style={{
        position: "absolute",
        width: "3px",
        height: "3px",
        background: "rgba(255, 255, 255, 0.3)",
        borderRadius: "50%",
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        y: [0, -20, 0],
        opacity: [0.3, 0.8, 0.3],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        delay: Math.random() * 2,
      }}
    />
  ));

  return (
    <Container>
      <Header>
        <div>
          <Title>Kafka Path Visualizer</Title>
          <Subtitle>Real-time coordinate streaming & path finding</Subtitle>
        </div>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <ConnectionStatus status={connectionStatus} />
          <MessageStats
            messageCount={messageCount}
            pathCount={pathData.length}
          />
        </div>
      </Header>

      <MainContent>
        <ParticleBackground>{particles}</ParticleBackground>

        <VisualizationArea>
          <AnimatePresence>
            {currentGrid && (
              <motion.div
                key={`${currentGrid.m}-${currentGrid.n}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{ position: "relative" }}
              >
                <Grid m={currentGrid.m} n={currentGrid.n} />

                <AnimatePresence>
                  {animatingPaths.map((path) => (
                    <PathPoint
                      key={path.timestamp}
                      x={path.x}
                      y={path.y}
                      m={path.m}
                      n={path.n}
                      result={path.result}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {!currentGrid && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                textAlign: "center",
                color: "white",
                fontSize: "1.5rem",
                fontWeight: 300,
              }}
            >
              Waiting for path data...
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{
                  width: "40px",
                  height: "40px",
                  border: "3px solid rgba(255, 255, 255, 0.3)",
                  borderTop: "3px solid white",
                  borderRadius: "50%",
                  margin: "20px auto",
                }}
              />
            </motion.div>
          )}
        </VisualizationArea>
      </MainContent>
    </Container>
  );
};

export default PathVisualization;
