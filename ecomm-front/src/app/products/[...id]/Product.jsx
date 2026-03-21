import React, { useContext, useState } from "react";
import styled from "styled-components";
import { Title } from "@/app/components/NewProducts";
import { CartContext } from "@/app/components/CartContext";
import Btn from "../../components/Btn";
const ColWrapper = styled.div`
  display: grid;
  grid-template-rows: 0.8fr 1.2fr;
  gap: 40px;
  margin-top: 50px;
  /* @media screen and (min-width:400px){
    grid-template-columns: 1.2fr .8fr;
  } */
  /* @media screen and (min-width:600px){
    grid-template-columns: 1.2fr .8fr;
  } */
  @media screen and (min-width: 800px) {
    grid-template-rows: none;
    grid-template-columns: 0.8fr 1.2fr;
  }
`;
const Box = styled.div`
  display: grid;
  grid-template-rows: 0.4fr 1.6fr;
  background-color: #fff;
  border: gray;
  border-radius: 10px;
  padding: 20px;
  gap: 10px;
  height: auto;
  @media screen and (min-width: 400px) {
    grid-template-rows: none;
    grid-template-columns: 0.4fr 1.6fr;
  }
`;

const ImagePannel = styled.div`
  display: flex;

  justify-content: space-around;
  gap: 5px;
  border-radius: 5px;

  @media screen and (min-width: 400px) {
    flex-direction: column;
  }
`;
const MainImage = styled.div`
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  img {
    width: auto;
    min-height: 200px;
    max-height: 340px;
  }
`;
const Img = styled.img`
  width: 100px; /* Set a fixed width for the images */
  max-height: 100px; /* Let the height adjust according to aspect ratio */
  border: 2px solid #ccc;
  border-radius: 5px;
  background-color: #ccc;
  box-shadow: #ccc;
`;
const ImageWrapper = styled.div`
  width: 100px; /* Fixed width for the image container */
  height: auto; /* Let the height adjust based on the content */
`;
const ProductInfoBox = styled.div`
  background-color: #fff;
  border: gray;
  border-radius: 10px;
  padding: 20px;
  gap: 10px;
  height: auto;
`;
const Product = ({ prod }) => {
  const [idx, setIndex] = useState(0);
  const { addToCart } = useContext(CartContext);
  return (
    <ColWrapper>
      <Box>
        <ImagePannel>
          {prod?.productImages?.length > 0 &&
            prod.productImages.map((currimg, index) => (
              <ImageWrapper key={index}>
                <Img
                  src={currimg}
                  alt={prod.productName}
                  onClick={() => setIndex(index)}
                />
              </ImageWrapper>
            ))}
        </ImagePannel>
        <MainImage>
          <img src={prod?.productImages?.[idx]} alt={prod?.productName} />
        </MainImage>
      </Box>
      <ProductInfoBox>
        <Title>{prod.productName}</Title>
        <div className="flex items-center">
          <div>₹{prod.price}</div>
          <Btn primary={"true"} size={"l"} onClick={() => addToCart(prod._id)}>
            Add To Cart
          </Btn>
        </div>
        <label className="text-lg">About this item</label>
        <p>{prod.description}</p>
      </ProductInfoBox>
    </ColWrapper>
  );
};

export default Product;
