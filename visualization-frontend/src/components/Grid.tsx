import React from "react";
import { motion } from "framer-motion";
import styled from "styled-components";

const GridContainer = styled.div<{ m: number; n: number }>`
  display: grid;
  grid-template-columns: repeat(${(props) => props.n}, 40px);
  grid-template-rows: repeat(${(props) => props.m}, 40px);
  gap: 2px;
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const Cell = styled(motion.div)<{ isStart?: boolean; isEnd?: boolean }>`
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: white;
  font-weight: 500;
  background: ${(props) =>
    props.isStart
      ? "linear-gradient(135deg, #00ff88, #00cc6a)"
      : props.isEnd
      ? "linear-gradient(135deg, #ff6b6b, #ee5a52)"
      : "rgba(255, 255, 255, 0.1)"};
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    background: ${(props) =>
      props.isStart
        ? "linear-gradient(135deg, #00ff88, #00cc6a)"
        : props.isEnd
        ? "linear-gradient(135deg, #ff6b6b, #ee5a52)"
        : "rgba(255, 255, 255, 0.2)"};
  }
`;

interface GridProps {
  m: number;
  n: number;
}

const Grid: React.FC<GridProps> = ({ m, n }) => {
  const cells = [];

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      const isStart = i === 0 && j === 0;
      const isEnd = i === m - 1 && j === n - 1;

      cells.push(
        <Cell
          key={`${i}-${j}`}
          isStart={isStart}
          isEnd={isEnd}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: (i + j) * 0.05,
            duration: 0.3,
            ease: "easeOut",
          }}
          whileHover={{ scale: 1.1 }}
        >
          {isStart && "S"}
          {isEnd && "E"}
          {!isStart && !isEnd && `${i},${j}`}
        </Cell>
      );
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GridContainer m={m} n={n}>
        {cells}
      </GridContainer>
    </motion.div>
  );
};

export default Grid;
