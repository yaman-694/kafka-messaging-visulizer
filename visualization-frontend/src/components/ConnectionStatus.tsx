import React from "react";
import { motion } from "framer-motion";
import styled from "styled-components";

const StatusContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const StatusDot = styled(motion.div)<{ isConnected: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) => (props.isConnected ? "#00ff88" : "#ff6b6b")};
  box-shadow: ${(props) =>
    props.isConnected
      ? "0 0 10px #00ff88, 0 0 20px #00ff88"
      : "0 0 10px #ff6b6b, 0 0 20px #ff6b6b"};
`;

const StatusText = styled.span`
  color: white;
  font-size: 14px;
  font-weight: 500;
`;

interface ConnectionStatusProps {
  status: "connecting" | "connected" | "disconnected" | "error";
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  const isConnected = status === "connected";

  const getStatusText = () => {
    switch (status) {
      case "connecting":
        return "Connecting...";
      case "connected":
        return "Connected";
      case "disconnected":
        return "Disconnected";
      case "error":
        return "Connection Error";
      default:
        return "Unknown";
    }
  };

  return (
    <StatusContainer
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <StatusDot
        isConnected={isConnected}
        animate={{
          scale: isConnected ? [1, 1.2, 1] : [1, 0.8, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <StatusText>{getStatusText()}</StatusText>
    </StatusContainer>
  );
};

export default ConnectionStatus;
