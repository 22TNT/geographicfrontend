import React, {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {ValidationErrors} from "final-form";
import {Field, Form as FinalForm} from "react-final-form";

import {MapContainer, TileLayer, useMap, Marker, Popup, Polygon, Polyline, Rectangle} from "react-leaflet";
import L, {LatLng, LatLngBounds, LatLngBoundsExpression, LatLngTuple} from "leaflet";
import "leaflet/dist/leaflet.css";
import '../App.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import {nanoid} from "nanoid";

import {url} from "../queries";
import exp from "constants";

type Material = {
    id: string,
    name: string,
    properties: string[],
};

type State = {
    material: Material,
    levelOfContamination: number,
};

type ExportableNode = {
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
    contamination: State[],
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

type Wind = {
    direction: number,
    speed: number,
}

export default function Map() {
    const {simID} = useParams();

    const [mapread, setMapread] = useState<ExportableNode[]>([]);
    const [sources, setSources] = useState<Sources[]>([])
    const [center, setCenter] = useState<LatLngTuple>([0, 0]);
    const [borders, setBorders] = useState<LatLngBoundsExpression>(new LatLngBounds([0, 0], [0, 0]));

    const [wind, setWind] = useState<Wind>({direction: 0, speed: 0});
    const [loadedSources, setLoadedSources] = useState<boolean>(false);
    const [loadedWind, setLoadedWind] = useState<boolean>(false);
    const [tick, setTick] = useState<number>(0);

    const [paused, setPaused] = useState<boolean>(true);

    const nodesRequest = async () => {
        const response = await fetch(`${url}/v2/${simID}/frame/${tick}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        let result = await response.json();
        setMapread(result);
    };

    const framePost = async () => {
        const response = await fetch(`${url}/${simID}/frame/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({frames: 1}),
        })
        let result = await response.text();
    };


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

    const sourceRequest = async () => {
        const response = await fetch(`${url}/${simID}/source`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        let result = await response.json();
        setSources(result);
    };

    const windRequest = async () => {
        const response = await fetch(`${url}/${simID}/wind/${tick}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        let result = await response.json();
        setWind(result);
    }

    useEffect(() => {
        infoRequest().then(() => setLoadedSources(true));
        windRequest().then(() => setLoadedWind(true));
        sourceRequest();
    }, []);

    useEffect(() => {
        const timerId = setInterval(
            async () => {
                if (!paused) {
                    await framePost().then(() => nodesRequest().then(() => windRequest()).then(() => {
                        setTick(tick=> tick+1);}))
                }
            },
            2000
        );
        return () => clearInterval(timerId);
    }, [framePost, nodesRequest, paused, tick, windRequest]);

    function getLevel(node: ExportableNode): number {
        let level = 0;
        node.contamination.forEach((stuff) => {
            level += stuff.levelOfContamination;
        });
        return level;
    }

    return (
        <div>
            {loadedSources && (<MapContainer center={center} zoom={10} scrollWheelZoom={true}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Rectangle
                    pathOptions={{color: "black"}}
                    bounds={borders}
                    fillOpacity={0}
                />
                {mapread.map((exportnode) => {
                    return (
                        <Rectangle
                            opacity={getLevel(exportnode)}
                            color={"red"}
                            bounds={[
                                [exportnode.lat1, exportnode.lng1],
                                [exportnode.lat2, exportnode.lng2],
                            ]}
                        />
                    );
                })}
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
            </MapContainer>)}
            <br/>
            {
                loadedWind && (<>Direction = {wind.direction} Speed = {wind.speed}</>)
            }
            <br/>
            <input type={"range"} value={100} min={0} max={100} style={{width: 980}}/>
            <br/>
            <>1 секунда = 1 минута   </>
            <button onClick={() => setPaused(paused => !paused)}>{paused ? "Пуск" : "Пауза"}</button>
        </div>)
}
