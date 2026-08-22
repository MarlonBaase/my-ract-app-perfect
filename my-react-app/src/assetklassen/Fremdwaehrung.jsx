import { Outlet, Link } from 'react-router-dom'
import Navbar from '../Navbar'


export default function Fremdwaehrung() {


    return (
        <div>
            <h2>Fremdwaehrung</h2>

                <Navbar />

            <Outlet />
        </div>
    )
}