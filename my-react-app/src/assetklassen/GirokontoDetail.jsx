import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { SettingsContext } from '../SettingsContext';
import {
    ladeGirokonto,
    ladeAssets,
    ladeElternkontoListe,
    ladeKategorien,
    ladeTransaktionenFuerAsset,
    girokontoHinzufuegen,
    girokontoSpeichern,
    transaktionHinzufuegen,
    pruefeWiederkehren,
    assetLoeschenMitLog
} from '../services/girokontoService';

export default function GirokontoDetail() {

    return(
        <div>
            <div className="header-bar">
                <h2>Girokonto</h2>
            </div>

        </div>
    )
}