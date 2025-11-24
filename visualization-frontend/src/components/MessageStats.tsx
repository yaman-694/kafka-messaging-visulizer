import React from "react";
import { motion } from "framer-motion";
import styled from "styled-components";

const StatsContainer = styled(motion.div)`
  display: flex;
  gap: 20px;
  align-items: center;
`;

const StatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  padding: 12px 20px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  min-width: 80px;
`;

const StatValue = styled.div`
  color: white;
  font-size: 1.8rem;
  font-weight: 600;
  line-height: 1;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

interface MessageStatsProps {
  messageCount: number;
  pathCount: number;
}

const MessageStats: React.FC<MessageStatsProps> = ({
  messageCount,
  pathCount,
}) => {
  return (
    <StatsContainer
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
    >
      <StatCard whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <StatValue>
          <motion.span
            key={messageCount}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {messageCount}
          </motion.span>
        </StatValue>
        <StatLabel>Messages</StatLabel>
      </StatCard>

      <StatCard whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <StatValue>
          <motion.span
            key={pathCount}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {pathCount}
          </motion.span>
        </StatValue>
        <StatLabel>Paths</StatLabel>
      </StatCard>
    </StatsContainer>
  );
};

export default MessageStats;
