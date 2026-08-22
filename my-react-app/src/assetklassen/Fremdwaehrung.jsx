import { Outlet, Link } from 'react-router-dom'
import Navbar from '../fremd_navbar'

export default function Fremdwaehrung() {
    

    return (
        <div>
            <h2>Fremdwaehrung</h2>
            
                <fremd_navbar />

            <Outlet />
        </div>
    )
}