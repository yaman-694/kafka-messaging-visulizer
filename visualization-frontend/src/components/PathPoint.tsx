import React from "react";
import { motion } from "framer-motion";
import styled from "styled-components";

const PathContainer = styled(motion.div)<{ x: number; y: number }>`
  position: absolute;
  left: ${(props) => props.x * 42 + 20}px;
  top: ${(props) => props.y * 42 + 20}px;
  z-index: 10;
`;

const PathDot = styled(motion.div)`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff9a9e, #fecfef, #fecfef);
  box-shadow: 0 0 20px rgba(255, 154, 158, 0.6),
    0 0 40px rgba(255, 154, 158, 0.4), 0 0 60px rgba(255, 154, 158, 0.2);
  position: relative;

  &::after {
    content: "";
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff9a9e, #fecfef);
    opacity: 0.3;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.3;
    }
    50% {
      transform: scale(1.5);
      opacity: 0.1;
    }
    100% {
      transform: scale(1);
      opacity: 0.3;
    }
  }
`;

const PathInfo = styled(motion.div)`
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const TrailEffect = styled(motion.div)`
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 154, 158, 0.3) 0%,
    transparent 70%
  );
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
`;

interface PathPointProps {
  x: number;
  y: number;
  m: number;
  n: number;
  result?: number;
}

const PathPoint: React.FC<PathPointProps> = ({ x, y, m, n, result }) => {
  return (
    <PathContainer
      x={x}
      y={y}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: [0, 1.2, 1],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: 3,
        times: [0, 0.2, 0.8, 1],
        ease: "easeOut",
      }}
    >
      <TrailEffect
        initial={{ scale: 0, opacity: 0.5 }}
        animate={{
          scale: [0, 2, 3],
          opacity: [0.5, 0.3, 0],
        }}
        transition={{
          duration: 3,
          ease: "easeOut",
        }}
      />

      <PathDot
        whileHover={{ scale: 1.3 }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          rotate: {
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      />

      <PathInfo
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ delay: 0.2 }}
      >
        ({x},{y}) in {m}×{n}
        {result && ` → ${result} paths`}
      </PathInfo>
    </PathContainer>
  );
};

export default PathPoint;
