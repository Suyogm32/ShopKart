import React, { useEffect, useContext } from "react";
import styled from "styled-components";
import { WhiteBox } from "../components/ProductBox";
import { CartContext } from "../components/CartContext";
const ItemWrapper = styled.div`
  display: grid;
  grid-template-columns: 1.5fr .5fr;
  gap: 20px;
  height: 150px;
  margin: 20px;
  /* border-radius: 10px; */
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  /* border: 1px solid black; */
  @media screen and (min-width:380px){
    grid-template-rows: none;
    grid-template-columns: 1fr 1fr;
  }
  @media screen and (min-width:800px){
    grid-template-rows: none;
    grid-template-columns: 0.7fr 1.3fr;
  }
`;
const ImgWrrapper = styled.div`
  background-color: #f3eeee;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  margin: auto;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 130px;
  border-radius: 5px;
  img {
    max-width: 100%;
    max-height: 120px;
  }
`;
const ProductTitle = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  @media screen and (min-width:800px){
    font-size: 0.75rem;
  font-weight: 500;
  }
  @media screen and (min-width:800px){
    font-size: 1rem;
  font-weight: 500;
  }
`;
const StyledQuantity = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  div {
    padding: 0.1rem;
  }
`;
const ProductInfo = styled.div`
  margin: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;
const Quant = styled.div`
  background-color: white;
  padding: 1px;
  padding-left: 1px;
  padding-right: 1px;
  margin: 1px;
  @media screen and (min-width:380px) {
    padding: 2px;
  padding-left: 1px;
  padding-right: 1px;
  margin: 2px;
  }
`;
const CartProductBox = ({ prod, quantity }) => {
  const { _id, productName, productImages, price } = prod;
  const { cartProducts, setCartProducts } = useContext(CartContext);

  const addQuantity = (id) => {
    setCartProducts((prev) => [...prev, id]);
  };
  const minusQuantity = (id) => {
    setCartProducts((prev) => {
      let arr = [...prev];
      const index = arr.indexOf(id);
      console.log(index);
      if (index > -1) {
        arr.splice(index, 1);
      }
      return arr;
    });
  };
  return (
    <ItemWrapper>
      <ImgWrrapper>
        <img src={productImages[0]} alt={productName} />
      </ImgWrrapper>
      <ProductInfo>
        <ProductTitle>{productName}</ProductTitle>
        <ProductTitle>${price}</ProductTitle>
        <StyledQuantity>
          <div>
            <button onClick={() => minusQuantity(_id)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 sm:w-1 sm:h-1"
              >
                <path
                  fillRule="evenodd"
                  d="M4.25 12a.75.75 0 0 1 .75-.75h14a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1-.75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <Quant>{quantity}</Quant>
          <div>
            <button onClick={() => addQuantity(_id)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 sm:w-1 sm:h-1"
              >
                <path
                  fillRule="evenodd"
                  d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </StyledQuantity>
      </ProductInfo>
    </ItemWrapper>
  );
};

export default CartProductBox;
