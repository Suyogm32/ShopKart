"use client";
import React from 'react'
import { GlobalStyles } from '@/app/page';
import Header from '@/app/components/Header';
import { Title } from '@/app/components/featured';
import styled from "styled-components";
const WhiteBox = styled.div`
  background-color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
  img {
    max-width: 100%;
    height: 200px;
    border: 1px solid white;
  }
`;
const Canceled = () => {
  return (
    <>
         <GlobalStyles />
      <Header />
      <WhiteBox>
        <img src='https://th.bing.com/th/id/R.cdc8921a161bed3ebe6a0d67705ad210?rik=hPmFnBbbQbveqQ&riu=http%3a%2f%2fimg4.wikia.nocookie.net%2f__cb20130326132551%2frating-system%2fimages%2f3%2f3f%2f450px-White_X_in_red_background.svg.png&ehk=scFq8iiIxaD12NevAiInF45wFv0EoLaDKPICHjDTcbs%3d&risl=&pid=ImgRaw&r=0' alt='canceled_img'/>
        <Title>Opps! Something went wrong</Title>
        <p>For any queries please contact on ecomm.support@gmail.com</p>
      </WhiteBox>
    </>
  )
}

export default Canceled

