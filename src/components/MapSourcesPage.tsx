import React, { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Rectangle,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import L, {LatLngBounds, LatLngBoundsExpression, LatLngTuple} from "leaflet";
import icon from 'leaflet/dist/images/marker-icon.png';
import {Field, Form as FinalForm} from "react-final-form";
import {ValidationErrors} from "final-form";
import {useNavigate, useParams} from "react-router-dom";
import {url} from "../queries";
import {nanoid} from "nanoid";


const App = () => {
    type Material = {
        id: string,
        name: string,
        properties: string[],
    };

    type Sources = {
        lat: number,
        lng: number,
        height: number,
        material: Material,
        power: number,
        dispersionHorizontal: number,
        dispersionVertical: number,
    };

    const [borders, setBorders] = useState<LatLngBoundsExpression>(new LatLngBounds([0, 0], [0, 0]));
    const [center, setCenter] = useState<LatLngTuple>([0, 0]);
    const [loaded, setLoaded] = useState<boolean>(false);
    const [sources, setSources] = useState<Sources[]>([])
    const {simID} = useParams();

    type WindFormValues = {
        tick: string,
        speed: string,
        direction: string,
    }

    type SourceFormValues = {
        lat: string,
        lng: string,
        height: string,
        power: string,
        dispH: string,
        dispV: string,
        materialName: string,
    }

    const infoRequest = async () => {
        const response = await fetch(`${url}/${simID}/info`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        let result = await response.json();
        setCenter([
            (parseFloat(result.lat1) + parseFloat(result.lat2)) / 2,
            (parseFloat(result.lng1) + parseFloat(result.lng2)) / 2,
        ]);
        setBorders(new LatLngBounds([result.lat1, result.lng1], [result.lat2, result.lng2]));
    };

    const getSources = async () => {
        const response = await fetch(`${url}/${simID}/source`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        let result = await response.json();
        setSources(result);
    };

    const isValidWind = (values: WindFormValues): ValidationErrors => {
        const errors: ValidationErrors = {};

        if (!/^([0-9]+([.][0-9]*)?|[.][0-9]+)$/.test(values?.tick)) {
            errors.lat1 = "Тик должен быть числом";
        }
        if (!/^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/.test(values?.speed)) {
            errors.lat2 = "Скорость должна быть числом";
        }
        if (!/^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/.test(values?.direction)) {
            errors.lng1 = "Направление должно быть числом";
        }
        return errors;
    }
    const onSubmitWind = async (values: WindFormValues) => {
        const windRequest = async () => {
            const body = JSON.stringify({
                tick: values.tick,
                wind: {
                    speed: values.speed,
                    direction: values.direction
                }
            });
            console.log(body);
            const res = await fetch(`${url}/${simID}/wind/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: body,
            })
            return res.text();
        };
        const resp = await windRequest();
    };

    const isValidSource = (values: SourceFormValues): ValidationErrors => {
        const errors: ValidationErrors = {};

        if (!/^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/.test(values?.lat)) {
            errors.lat = "Широта должна быть числом";
        }
        if (!/^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/.test(values?.lng)) {
            errors.lng = "Долгота должна быть числом";
        }
        if (!/^([0-9]+([.][0-9]*)?|[.][0-9]+)$/.test(values?.height)) {
            errors.height = "Высота должна быть числом";
        }
        if (!/^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/.test(values?.power)) {
            errors.power = "Сила должна быть числом";
        }
        if (!/^([0-9]+([.][0-9]*)?|[.][0-9]+)$/.test(values?.dispV)) {
            errors.len = "Вертикальная дисперсия должна быть числом";
        }
        if (!/^([0-9]+([.][0-9]*)?|[.][0-9]+)$/.test(values?.dispH)) {
            errors.len = "Горизонтальная дисперсия должна быть числом";
        }
        if (values?.materialName?.length < 1) {
            errors.len = "Введите название";
        }
        return errors;
    }

    const onSubmitSource = async (values: SourceFormValues) => {
        const sourceRequest = async () => {
            const res = await fetch(`${url}/${simID}/source/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    lat: values.lat,
                    lng: values.lng,
                    height: values.height,
                    power: values.power,
                    dispH: values.dispH,
                    dispV: values.dispV,
                    material: {
                        id: nanoid(),
                        name: values.materialName,
                        properties: []
                    }
                }),
            })
            return res.text();
        };
        const resp = await sourceRequest().then(getSources);
    }

    useEffect(() => {
        infoRequest().then(() => setLoaded(true));
    })

    const navigate = useNavigate();


    return (
        <div className="app">
            <div className="map">
                {loaded && <MapContainer center={center} zoom={14} className="map-container">
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Rectangle
                        pathOptions={{color: "black"}}
                        bounds={borders}
                        fillOpacity={0}
                    />
                    {sources.map((source) => {
                        return (
                            <Marker
                                position={[source.lat, source.lng]}
                                icon={L.icon({iconUrl: icon})}>
                                <Popup>
                                    {source.material.name}
                                </Popup>
                            </Marker>
                        )
                    })}
                </MapContainer>}
                <div className={"underMap"}></div>
            </div>
            <div className={"Menu"}>
                <div>
                    <h1>MoniPoll</h1>
                    <div>
                        <FinalForm
                            onSubmit={onSubmitWind}
                            validate={isValidWind}
                            render={({handleSubmit}) => (
                                <form onSubmit={handleSubmit}>
                                    <Field name="tick">
                                        {({input, meta}) => (
                                            <div>
                                                <label>Тик:
                                                    <input type="text" {...input} placeholder="0"/>
                                                </label>
                                                {meta.touched && meta.error && <div>{meta.error}</div>}
                                            </div>
                                        )}
                                    </Field>
                                    <Field name="speed">
                                        {({input, meta}) => (
                                            <div>
                                                <label>Скорость ветра:
                                                    <input type="text" {...input} placeholder="0"/>
                                                </label>
                                                {meta.touched && meta.error && <div>{meta.error}</div>}
                                            </div>
                                        )}
                                    </Field>
                                    <Field name="direction">
                                        {({input, meta}) => (
                                            <div>
                                                <label>Направление ветра:
                                                    <input type="text" {...input} placeholder="0"/>
                                                </label>
                                                {meta.touched && meta.error && <div>{meta.error}</div>}
                                            </div>
                                        )}
                                    </Field>
                                    <button type="submit">Добавить</button>
                                </form>
                            )}>
                        </FinalForm>
                        </div>
                    <br/><br/>
                    <div>
                        <FinalForm
                            onSubmit={onSubmitSource}
                            validate={isValidSource}
                            render={({handleSubmit}) => (
                                <form onSubmit={handleSubmit}>
                                    <Field name="lat">
                                        {({input, meta}) => (
                                            <div>
                                                <label>Широта:
                                                    <input type="text" {...input} placeholder="54.05"/>
                                                </label>
                                                {meta.touched && meta.error && <div>{meta.error}</div>}
                                            </div>
                                        )}
                                    </Field>
                                    <Field name="lng">
                                        {({input, meta}) => (
                                            <div>
                                                <label>Долгота:
                                                    <input type="text" {...input} placeholder="83.1"/>
                                                </label>
                                                {meta.touched && meta.error && <div>{meta.error}</div>}
                                            </div>
                                        )}
                                    </Field>
                                    <Field name="height">
                                        {({input, meta}) => (
                                            <div>
                                                <label>Высота источника:
                                                    <input type="text" {...input} placeholder="60"/>
                                                </label>
                                                {meta.touched && meta.error && <div>{meta.error}</div>}
                                            </div>
                                        )}
                                    </Field>
                                    <Field name="power">
                                        {({input, meta}) => (
                                            <div>
                                                <label>Мощность:
                                                    <input type="text" {...input} placeholder="2"/>
                                                </label>
                                                {meta.touched && meta.error && <div>{meta.error}</div>}
                                            </div>
                                        )}
                                    </Field>
                                    <Field name="dispH">
                                        {({input, meta}) => (
                                            <div>
                                                <label>Горизонтальная дисперсия:
                                                    <input type="text" {...input} placeholder="0.1"/>
                                                </label>
                                                {meta.touched && meta.error && <div>{meta.error}</div>}
                                            </div>
                                        )}
                                    </Field>
                                    <Field name="dispV">
                                        {({input, meta}) => (
                                            <div>
                                                <label>Вертикальная дисперсия:
                                                    <input type="text" {...input} placeholder="0.2"/>
                                                </label>
                                                {meta.touched && meta.error && <div>{meta.error}</div>}
                                            </div>
                                        )}
                                    </Field>
                                    <Field name="materialName">
                                        {({input, meta}) => (
                                            <div>
                                                <label>Название материала:
                                                    <input type="text" {...input} placeholder="Название"/>
                                                </label>
                                                {meta.touched && meta.error && <div>{meta.error}</div>}
                                            </div>
                                        )}
                                    </Field>
                                    <button type="submit">Добавить</button>
                                </form>
                            )}>
                        </FinalForm>
                    </div>
                </div>
                <br/><br/>
                <button onClick={(e) => navigate(`/map/${simID}`)}>Перейти к симуляции</button>
            </div>
        </div>
    );
};

export default App;
