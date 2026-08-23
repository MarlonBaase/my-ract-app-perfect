import { useParams } from 'react-router-dom';
import { Outlet, Link } from 'react-router-dom'
import { useEffect, useState } from "react";


const { code } = useParams(); // 'code' enthält jetzt z. B. "USD"


export default function FremdwaehrungDetail() {
  return (
    <div>
      <h2>Detail</h2>
      
      <Outlet />
    </div>
  )
}