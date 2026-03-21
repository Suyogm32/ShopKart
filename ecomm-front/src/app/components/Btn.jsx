import React from "react";
import styled, { css } from "styled-components";

export const ButtonStyle =css`
  padding: 8px;
  padding-left: 0px;
  margin: 5px;
  border-radius: 5px;
  cursor: pointer;
  color: #aaa;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  ${(props) =>
    props.primary &&
    css`
      color: black;
      background-color: white;
      padding: 8px;
      border: 1px solid #5542f6;
      flex-direction: row;
      gap: 2px;
    `};
  ${(props) =>
    props.secondary &&
    css`
      color: white;
      background-color: #222;
      border: 1px solid white;
      border-radius: 5px;
      padding: 8px;
    `};

  ${(props)=> props.block && 
    css`
      display: block;
      width: 100%;
      
    `
  }
`;
const StyledBtn = styled.button`
  ${ButtonStyle}
`;
const Btn = ({ children, ...rest }) => {
  return (

      <StyledBtn {...rest}>{children}</StyledBtn>

  );
};

export default Btn;
