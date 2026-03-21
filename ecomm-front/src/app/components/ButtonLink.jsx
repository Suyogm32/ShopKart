import React from 'react'
import Link from 'next/link'
import { ButtonStyle } from './Btn';
import styled from 'styled-components';
const StyledLink=styled(Link)`
${ButtonStyle}  
`;
const ButtonLink = ({ href, children, ...rest }) => {
  return (
    
    <StyledLink href={href} {...rest}>{children}</StyledLink>
  
  )
}

export default ButtonLink