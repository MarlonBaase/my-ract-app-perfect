import { Outlet, Link } from 'react-router-dom'
import fremd_navbar from '../fremd_navbar'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

export default function Fremdwaehrung() {


    return (
        <div>
            <h2>Fremdwaehrung</h2>

            <BrowserRouter>
                <fremd_navbar />
            </BrowserRouter>

            <Outlet />
        </div>
    )
}