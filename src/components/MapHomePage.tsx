import React, { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    GeoJSON,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import L, {LatLngBounds, LatLngTuple} from "leaflet";
import {Field, Form as FinalForm} from "react-final-form";
import {ValidationErrors} from "final-form";
import {useNavigate} from "react-router-dom";
import {url} from "../queries";

type SimulationFormValues = {
    lat1: string,
    lng1: string,
    lat2: string,
    lng2: string,
    len: string,
}

const SECONDS_PER_HOUR = 1;
const App = () => {
    const center: LatLngTuple = [54.8463, 83.0884];
    const [openID, setOpenID] = useState<string>("");

    const isValid = (values: SimulationFormValues): ValidationErrors => {
        const errors: ValidationErrors = {};

        if (!/^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/.test(values?.lat1)) {
            errors.lat1 = "Широта должна быть числом";
        }
        if (!/^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/.test(values?.lat2)) {
            errors.lat2 = "Широта должна быть числом";
        }
        if (!/^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/.test(values?.lng1)) {
            errors.lng1 = "Долгота должна быть числом";
        }
        if (!/^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/.test(values?.lng2)) {
            errors.lng2 = "Долгота должна быть числом";
        }
        if (!/^([0-9]+([.][0-9]*)?|[.][0-9]+)$/.test(values?.len)) {
            errors.len = "Длина ячейки должна быть числом";
        }
        return errors;
    }
    const navigate = useNavigate();

    const onSubmit = async (values: SimulationFormValues) => {
        const settingsRequest = async () => {
            console.log(values);
            const res = await fetch(`${url}/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            })
            return res.json();
        };
        const resp = await settingsRequest();
        if (resp) {
            navigate(`/settings/${resp.id}`);
        }
    };

    const openSim = async () => {
        const infoRequest = async () => {
            const response = await fetch(`${url}/${openID}/info`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            return response.ok;
        };
        const resp = await infoRequest();
        if (resp) {
            navigate(`/map/${openID}`);
        }
        else {
            setOpenID("Нет такой симуляции");
        }
    }

    return (
        <div className="app">
            <div className="map">
                <MapContainer center={center} zoom={15} className="map-container">
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </MapContainer>
                <div className={"underMap"}>
                </div>

            </div>
            <div className={"Menu"}>
                <div>
                    <h1>MoniPoll</h1>
                    <div className={"ZoneForm"}>
                        <FinalForm
                            onSubmit={onSubmit}
                            validate={isValid}
                            render={({handleSubmit}) => (
                                <form onSubmit={handleSubmit}>
                                    <Field name="lat1">
                                        {({input, meta}) => (
                                            <div>
                                                <label>Широта 1:
                                                    <input type="text" {...input} placeholder="54.00"/>
                                                </label>
                                                {meta.touched && meta.error && <div>{meta.error}</div>}
                                            </div>
                                        )}
                                    </Field>
                                    <Field name="lng1">
                                        {({input, meta}) => (
                                            <div>
                                                <label>Долгота 1:
                                                    <input type="text" {...input} placeholder="83.00"/>
                                                </label>
                                                {meta.touched && meta.error && <div>{meta.error}</div>}
                                            </div>
                                        )}
                                    </Field>
                                    <Field name="lat2">
                                        {({input, meta}) => (
                                            <div>
                                                <label>Широта 2:
                                                    <input type="text" {...input} placeholder="54.40"/>
                                                </label>
                                                {meta.touched && meta.error && <div>{meta.error}</div>}
                                            </div>
                                        )}
                                    </Field>
                                    <Field name="lng2">
                                        {({input, meta}) => (
                                            <div>
                                                <label>Долгота 2:
                                                    <input type="text" {...input} placeholder="83.40"/>
                                                </label>
                                                {meta.touched && meta.error && <div>{meta.error}</div>}
                                            </div>
                                        )}
                                    </Field>
                                    <Field name="len">
                                        {({input, meta}) => (
                                            <div>
                                                <label>Длина ячейки:
                                                    <input type="text" {...input} placeholder="10"/>
                                                </label>
                                                {meta.touched && meta.error && <div>{meta.error}</div>}
                                            </div>
                                        )}
                                    </Field>
                                    <button type="submit">Создать</button>
                                </form>
                            )}>
                        </FinalForm>
                    </div>
                    <div className={"existingSimulation"}>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                openSim();
                            }
                        }>
                            <label>ID:
                                <input
                                    type={"text"}
                                    value={openID}
                                    placeholder={"ABCDEF123456"}
                                    onChange={(e) => setOpenID(e.target.value)}
                                />
                            </label>
                            <br/>
                            <button type={"submit"}>Открыть</button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default App;
