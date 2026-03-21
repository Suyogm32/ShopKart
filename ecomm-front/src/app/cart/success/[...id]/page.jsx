"use client";
import React, { useEffect } from 'react'
import { GlobalStyles } from '@/app/page';
import Header from '@/app/components/Header';
import { Title } from '@/app/components/featured';
import styled from "styled-components";
import { usePathname } from 'next/navigation';
import axios from 'axios';
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
const Success = () => {
  const ls=typeof window !== "undefined" ? window.localStorage : null;
  const path=usePathname();
  let patharray=path.split('/');
  let id=patharray[patharray.length-1];
  console.log(id);
  const data={
    _id:id,
    Paid:true
  }
  useEffect(()=>{
    axios.put('/api/success',data)
    .then(resp=>{
      ls.removeItem('cart');
    }) 
  },[]);

  return (
    <div>
        <GlobalStyles />
      <Header />
      <WhiteBox>
        <img src='https://zeuxinnovation.com/wp-content/uploads/2023/04/maximising-user-satisfaction-1.jpg' alt='success_img'/>
        <Title>Payment Successful</Title>
        <p>Your order is placed, Happy Shopping  😀</p>
      </WhiteBox>
    </div>
  )
}

export default Success