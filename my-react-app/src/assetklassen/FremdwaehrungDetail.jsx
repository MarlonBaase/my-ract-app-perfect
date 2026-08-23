import { useParams, Outlet, Link } from 'react-router-dom';
import { useEffect, useState } from "react";

export default function FremdwaehrungDetail() {
  const { code } = useParams(); // 'code' enthält jetzt z. B. "USD"

  return (
    <div>
      <h2>Details für Währung: {code}</h2>
      
      <Outlet />
    </div>
  );
}