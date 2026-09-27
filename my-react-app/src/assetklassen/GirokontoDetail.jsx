import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { SettingsContext } from '../SettingsContext';
import {
} from '../services/girokonto_detailService';

export default function GirokontoDetail() {

    return(
        <div>
            <div className="header-bar">
                <h2>Girokonto</h2>
            </div>

        </div>
    )
}