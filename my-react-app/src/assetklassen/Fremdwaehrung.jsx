import { Outlet, Link } from 'react-router-dom'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'


export default function Fremdwaehrung() {
    return (
        <div>
            <h2>Fremdwaehrung</h2>

            <Routes>
                <Route path="fremdwaehrung_Stammdaten" element={<fremdwaehrung_Stammdaten darkMode={darkMode} />} />
                <Route path="fremdwaehrung_Konto" element={<fremdwaehrung_Konto darkMode={darkMode} />} />
            </Routes>

            <Outlet />
        </div>
    )
}