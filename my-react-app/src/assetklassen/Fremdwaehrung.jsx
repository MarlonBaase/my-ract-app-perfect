import { Outlet, Link } from 'react-router-dom'
import Navbar from '../fremd_navbar'


export default function Fremdwaehrung() {


    return (
        <div>
            <Navbar />

                <h2>Fremdwaehrung</h2>

            <Outlet />
        </div>
    )
}