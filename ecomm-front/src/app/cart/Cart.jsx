"use client";
import React, { useContext, useEffect, useState } from "react";
import { CartContext } from "../components/CartContext";
import styled from "styled-components";
import Center from "../components/Center";
import Btn from "../components/Btn";
import axios from "axios";
import CartProductBox from "./CartProductBox";
import Input from "../components/Input";
const ColumnsWrapper = styled.div`
  display: grid;
  grid-template-row: 1.3fr 0.7fr;
  gap: 40px;
  box-shadow: 2px gray;
  margin-top: 30px;
  @media screen and (min-width:600px){
    grid-template-rows: none;
    grid-template-columns: 1.2fr 0.8fr;
  }
  @media screen and (min-width:800px){
    grid-template-rows: none;
    grid-template-columns: 1.3fr 0.7fr;
  }
`;
const Box = styled.div`
  background-color: #fff;
  border: gray;
  border-radius: 10px;
  padding: 20px;
`;
const Title = styled.h1`
  font-weight: 600;
  font-size: 1.5rem;
`;
const TotalPriceStyle = styled.div`
  display: flex;
  justify-content: end;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
`;
const CityHolder = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`;

const MyCart = () => {
  const { cartProducts, setCartProducts } = useContext(CartContext);
  let initialState = {
    Name: "",
    Email: "",
    Address: "",
    City: "",
    Postalcode: "",
    State: "",
    Country: "",
    products:cartProducts,
  };
  console.log("length of CartProducts ", cartProducts?.length);
  const [products, setProducts] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [userDetails, setUserDetails] = useState(initialState);
  const [error,setError]=useState('');
  useEffect(() => {
    if (cartProducts?.length > 0) {
      axios
        .post("/api/cart", { ids: cartProducts })
        .then((resp) => {
          setProducts(resp.data);
          console.log("data",resp.data);
          const newdetails = { ...userDetails };
          newdetails.products = cartProducts;
          setUserDetails(newdetails);
        })
        .catch((e) => {
          console.log(e);
        });
    } else {
      setProducts([]);
    }
  }, [cartProducts]);
  useEffect(() => {
    let currentPrice = 0;
    products.forEach((product) => {
      let quant = cartProducts.filter((id) => id === product._id).length;
      currentPrice += product.price * quant;
    });
    setTotalPrice(currentPrice);
  }, [cartProducts, products]);
  const PutAttribute = (e, attribute) => {
    const newdetails = { ...userDetails };
    newdetails[attribute] = e.target.value;
    setUserDetails(newdetails);
  };
  const saveUserCart=async(e)=>{
    e.preventDefault();
    try{
      const data=userDetails;
      console.log("data at checkout",data);
      const resp=await axios.post("/api/checkout",data);
      console.log(resp.data.url);
      if(resp.data.url){
        window.location=resp.data.url;
      }
    }catch (error) {
      // Handle Axios POST request error
      console.error("Error creating product:", error);
      setError("Failed to create product. Please try again later.");
    }
  };
  return (
    <div>
      <Center>
        <ColumnsWrapper>
          <Box>
            {cartProducts?.length == 0 && (
              <div>
                <Title>Your Cart is empty.😢</Title>
                <div>
                  Your shopping cart is waiting. Give it purpose – fill it with
                  groceries, clothing, household supplies, electronics and more.
                </div>
              </div>
            )}
            {products?.length > 0 && (
              <div className="gap-2">
                <Title>Cart</Title>
                {products.map((product) => (
                  <div key={product._id}>
                    <CartProductBox
                      prod={product}
                      quantity={
                        cartProducts?.filter((id) => id === product._id).length
                      }
                    />
                  </div>
                ))}
              </div>
            )}
            <TotalPriceStyle>
              <div>
                Subtotal ({cartProducts?.length} items):{totalPrice}
              </div>
            </TotalPriceStyle>
          </Box>
          {cartProducts?.length > 0 && (
            <Box>
              <Title>Order Summary</Title>

                <Input
                  type="text"
                  placeholder="Name"
                  value={userDetails.Name}
                  name="Name"
                  onChange={(e) => PutAttribute(e, "Name")}
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={userDetails.Email}
                  name="Email"
                  onChange={(e) => PutAttribute(e, "Email")}
                />
                <Input
                  type="text"
                  placeholder="Address"
                  name="Address"
                  value={userDetails.Address}
                  onChange={(e) => PutAttribute(e, "Address")}
                />
                <CityHolder>
                  <Input
                    type="text"
                    placeholder="City"
                    name="City"
                    value={userDetails.City}
                    onChange={(e) => PutAttribute(e, "City")}
                  />
                  <Input
                    type="number"
                    placeholder="PostalCode"
                    name="PostalCode"
                    value={userDetails.Postalcode}
                    onChange={(e) => PutAttribute(e, "Postalcode")}
                  />
                </CityHolder>
                <Input
                  type="text"
                  placeholder="State"
                  name="State"
                  value={userDetails.State}
                  onChange={(e) => PutAttribute(e, "State")}
                />
                <Input
                  type="text"
                  placeholder="Country"
                  name="Country"
                  value={userDetails.Country}
                  onChange={(e) => PutAttribute(e, "Country")}
                />
                <input type="hidden" name="productIds" value={cartProducts} />
                <Btn
                  secondary={"true"}
                  block={"true"}
                  onClick={saveUserCart}
                >
                  Continue to Payment
                </Btn>

            </Box>
          )}
        </ColumnsWrapper>
      </Center>
    </div>
  );
};

export default MyCart;
