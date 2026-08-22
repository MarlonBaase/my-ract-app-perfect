import { Outlet, Link } from 'react-router-dom'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './Navbar'

export default function Fremdwaehrung() {
    const [darkMode, setDarkMode] = useState(false)
    

    return (
        <div>
            <h2>Fremdwaehrung</h2>
            <BrowserRouter>
                <Navbar darkMode={darkMode} />
                <Routes>
                    <Route path="fremdwaehrung_Stammdaten" element={<fremdwaehrung_Stammdaten darkMode={darkMode} />} />
                    <Route path="fremdwaehrung_Konto" element={<fremdwaehrung_Konto darkMode={darkMode} />} />
                </Routes>
            </BrowserRouter>

            <Outlet />
        </div>
    )
}