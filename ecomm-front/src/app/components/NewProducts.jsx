import React, { useEffect, useState } from 'react'
import styled from 'styled-components';
import Center from './Center';
import ProductBox from './ProductBox';
export const ProductsGrid=styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  padding-top: 20px;
  @media screen and (min-width:300px) {
    grid-template-columns: 1fr 1fr;
  }
  @media screen and (min-width:600px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
  @media screen and (min-width:980px) {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
  @media screen and (min-width:1200px) {
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  }
`;
export const Title=styled.div`
  font-size: 2rem;
  font-weight: 700;
`;
const NewProducts = () => {
  const [recentProducts,setRecentProducts]=useState([]);
  useEffect(()=>{
    fetch('/api?limit=10',{
      method:"GET",
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    .then(resp => resp.json()) // Parse response body as JSON
    .then(data => {
      setRecentProducts(data);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
  },[])
  return (
    <Center>
      <Title>New Arrivals</Title>
    <ProductsGrid>
      {recentProducts?.length>0 &&
        recentProducts.map((product,index)=>(
          <ProductBox key={index} {...product}/>
        ))
      }
    </ProductsGrid>
    </Center>
  )
}

export default NewProducts