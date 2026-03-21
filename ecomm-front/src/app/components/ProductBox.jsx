"use client"
import React, { useContext } from "react";
import styled from "styled-components";
import CartIcon from "./icons/CartIcon";
import Link from "next/link";
import { CartContext } from "./CartContext";
const ProductWrapper = styled(Link)`
  height: 250px;
`;
export const WhiteBox = styled.div`
  background-color: white;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 170px;
  border-radius: 10px;
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
  img {
    max-width: 100%;
    height: 150px;
  }
`;
const Title = styled.div`
  font-size: 0.75rem;
  font-weight: 300;
  @media screen and (min-width:450px){
    font-size: 0.9rem;
  font-weight: normal;
  }
  @media screen and (min-width:600px){
    font-size: 0.8rem;
  font-weight: normal;
  }
  @media screen and (min-width:740px){
    font-size: 1rem;
  font-weight: normal;
  }
`;
const CartButton = styled.button`
  background-color: #eee;
  border: 1px solid white;
  border-radius: 50%;
  padding: 5px;
`;
const ProductInfoBox = styled.div`
  background-color: white;
  display: grid;
  padding: 5px;
  height: 60px;
  grid-template-columns: 1.6fr 0.4fr;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
`;
const PriceStyle = styled.div`
font-size: 0.75rem;
  font-weight: 500;
  @media screen and (min-width:450px){
    font-size: 1rem;
  font-weight: 500;
  }
  @media screen and (min-width:600px){
    font-size: 1.2rem;
  font-weight: 500;
  }
`;
const OuterBorder = styled.div`
  border: 1px solid gray;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
`;
const ProductBox = ({ _id, productName, productImages, price }) => {
  const url = "/products/" + _id;
  const {addToCart} = useContext(CartContext);
  return (
    <ProductWrapper href={url}>
      <WhiteBox>
        <img src={productImages[0]} alt={productName} />
      </WhiteBox>
      <ProductInfoBox>
        <div>
          <Title>{productName}</Title>
          <PriceStyle>₹{price}</PriceStyle>
        </div>
        <div>
          <OuterBorder>
            <CartButton onClick={(e) =>{
              e.preventDefault();
              e.stopPropagation();
              addToCart(_id);
            } }>
              <CartIcon />
            </CartButton>
          </OuterBorder>
        </div>
      </ProductInfoBox>
    </ProductWrapper>
  );
};

export default ProductBox;
