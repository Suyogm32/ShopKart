import React, { useContext } from "react";
import Center from "./Center";
import styled from "styled-components";
import Btn from "./Btn";
import ButtonLink from "./ButtonLink";
import CartIcon from "./icons/CartIcon";
import { CartContext } from "./CartContext";
import { StyleSheetManager } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';

const Bg = styled.div`
  background-color: #222;
  color: white;
`;
export const Title = styled.h1`
  font-weight: bold;
  font-size: 2rem;
`;
const Desc = styled.p`
  color: #aaa;
  font-size: 1.3rem;
`;
const Wrapper = styled.div`
  display: grid;
  grid-template-rows:0.9fr 1.1fr;
  gap: 40px;
  padding: 10px;
  div:nth-child(1){
    order: 2;
  }
  img {
    max-width: 100%;
    height: auto;
  }
  @media screen and (min-width:700px) {
    grid-template-rows: none;
    grid-template-columns: 0.9fr 1.1fr;
    div:nth-child(1){
    order: 0;
  }
  }
`;
const Colmns = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: start;
  margin-left: 4px;
  padding-left: 4px;
`;
const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-left: 10px 0px;
  font-size: 1.2rem;
`;
const FeaturedProduct = ({ product }) => {
  const {addToCart}=useContext(CartContext);

  return (
    <StyleSheetManager shouldForwardProp={prop => isPropValid(prop)}>
    <Bg>
      <Center>
        <Wrapper>
          <Colmns>

            <div>
              <Title>{product.productName}</Title>
              <Desc>{product.description}</Desc>
            </div>
            <ButtonWrapper>
              <ButtonLink href={"/products/" + product._id} secondary={"true"}>
                Read More
              </ButtonLink>
              <Btn primary={"true"} size={"l"} onClick={()=>addToCart(product._id)}>
                <CartIcon />
                Add To Cart
              </Btn>
            </ButtonWrapper>

          </Colmns>
          <Colmns>
            <img
              src="https://dawid-next-ecommerce.s3.amazonaws.com/1679151719649.png"
              alt="mac-image"
            />
          </Colmns>
        </Wrapper>
      </Center>
    </Bg>
    </StyleSheetManager>
  );
};

export default FeaturedProduct;
