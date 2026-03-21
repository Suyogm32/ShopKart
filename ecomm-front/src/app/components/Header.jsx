"use clinet";
import Link from "next/link";
import React, { useContext, useEffect, useState } from "react";
import styled, { css } from "styled-components";
import Center from "./Center";
import { CartContext } from "./CartContext";
import Bars from "./icons/Bars";

const StyledHeader = styled.header`
  background-color: #222;
  color: white;
`;
const Logo = styled(Link)`
  color: white;
  padding: 5px;
  margin: 5px;
  font-size: 1.5rem;
`;
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  ${(props) =>
    !props.showNav &&
    css`
      flex-direction: row;
    `};
  justify-content: space-between;
  @media screen and (min-width: 800px) {
    flex-direction: row;
  }
`;

const StyledNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 15px;
  background-color: #222;
  ${(props) =>
    !props.showNav &&
    css`
      display: none;
    `};
  @media screen and (min-width: 800px) {
    display: flex;
    flex-direction: row;
    position: static;
  }
`;
const NavButton = styled.button`
  cursor: pointer;
  top: 35px;
  right: 20px;
  position: absolute;
  
  @media screen and (min-width: 800px) {
    display: none;
  }
`;
const Header = () => {
  const [showNav, setShowNav] = useState(false);
  const { cartProducts, setCartProducts } = useContext(CartContext);
  return (
    <StyledHeader>
      <Center>
        <Wrapper showNav={showNav}>
          <Logo href={"/"}>Ecommerce</Logo>
          <StyledNav showNav={showNav} onClick={() => setShowNav((prev) => !prev)}>
            <Logo href={"/"} >Home</Logo>
            <Logo href={"/products"}>Products</Logo>
            <Logo href={"/catagories"} >Catagories</Logo>
            <Logo href={"/account"}>Account</Logo>
            <Logo href={"/cart"}>Cart ({cartProducts?.length || 0})</Logo>
          </StyledNav>
          <NavButton showNav={showNav} onClick={() => setShowNav((prev) => !prev)}>
            <Bars />
          </NavButton>
        </Wrapper>
      </Center>
    </StyledHeader>
  );
};

export default Header;
