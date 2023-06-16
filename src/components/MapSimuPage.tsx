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
import {useParams} from "react-router-dom";
import {url} from "../queries";
import icon from 'leaflet/dist/images/marker-icon.png';
import windIcon from "../arrow1.png";


const App = () => {
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
    const {simID} = useParams();

    const [mapread, setMapread] = useState<ExportableNode[]>([]);
    const [sources, setSources] = useState<Sources[]>([])
    const [center, setCenter] = useState<LatLngTuple>([0, 0]);
    const [borders, setBorders] = useState<LatLngBoundsExpression>(new LatLngBounds([0, 0], [0, 0]));

    const [wind, setWind] = useState<Wind>({direction: 0, speed: 0});
    const [loadedSources, setLoadedSources] = useState<boolean>(false);
    const [loadedWind, setLoadedWind] = useState<boolean>(false);
    const [tick, setTick] = useState<number>(0);
    const [tickStep, setTickStep] = useState<number>(1);
    const [framesLength, setFramesLength] = useState<number>(0);

    const [paused, setPaused] = useState<boolean>(true);


    const getNodes = async () => {
        const response = await fetch(`${url}/v3/${simID}/frame/${tick}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        let result = await response.json();
        setMapread(result);
    }

    const getFramesLength = async () => {
        const response = await fetch(`${url}/${simID}/frames`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        let result = await response.json();
        setFramesLength(parseInt(result));
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
                    await getNodes().then(() => windRequest()).then(() => {
                        setTick(tick=> tick+tickStep);
                        getFramesLength()})
                }
            },
            1000
        );
        return () => clearInterval(timerId);
    }, [getNodes, paused, tick, tickStep, windRequest]);

    function getLevel(node: ExportableNode): number {
        let level = 0;
        node.contamination.forEach((stuff) => {
            level += stuff.levelOfContamination;
        });
        return level;
    }

    return (
        <div className="app">
                <div className="map">
                    {loadedSources && (<MapContainer center={center} zoom={14} className="map-container">
                        <TileLayer
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
                    <div className={"underMap"}>
                        <input
                            type={"range"}
                            min={0}
                            max={framesLength}
                            step={1}
                            value={tick}
                            readOnly={!paused}
                            onChange={(e) => {
                                setTick(parseInt(e.target.value));
                                getNodes().then(() => windRequest())}}
                        />
                    </div>
                </div>


            <div className={"Menu"}>
                <h1>MoniPoll</h1>
                <div className={"windInfo"}>
                    <img src={windIcon} style={{transform: `rotate(${-90+wind.direction}deg`}}/>
                    <br/>
                    {
                        loadedWind && (<>Direction = {wind.direction} Speed = {wind.speed}</>)
                    }
                    <br/>
                </div>
                <div>
                    1 секунда =
                    <select
                        value={tickStep}
                        disabled={!paused}
                        onChange={e => setTickStep(parseInt(e.target.value))}
                    >
                        <option value={"1"}> 1 минута</option>
                        <option value={"5"}> 5 минут</option>
                        <option value={"10"}> 10 минут</option>
                    </select>
                    <br/>
                    <button onClick={() => setPaused(paused => !paused)}>{paused ? "Пуск" : "Пауза"}</button>
                </div>
            </div>
        </div>
    );
};

export default App;
