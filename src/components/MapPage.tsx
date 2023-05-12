import React, {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {ValidationErrors} from "final-form";
import {Field, Form as FinalForm} from "react-final-form";

import {MapContainer, TileLayer, useMap, Marker, Popup, Polygon, Polyline} from "react-leaflet";
import L, {LatLngTuple} from "leaflet";
import "leaflet/dist/leaflet.css";
import '../App.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import {nanoid} from "nanoid";

import {url} from "../queries";

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
}

type Node = {
    lat: number,
    lng: number,
    contaminations: State[],
};

type Frame = {
    id: string,
    windSpeed: number,
    windDirection: number,
    timeOfDay: number,
    tick: number,
    map: Node[][],
};

type ContaminationForm  = {
    lat: number,
    lng: number,
    state: State,
}

export default function Map() {
    const {simID} = useParams();
    const [frame, setFrame] = useState<Frame>({
        id: "1",
        windSpeed: 0,
        windDirection: 0,
        timeOfDay: 0,
        tick: 1,
        map: [],
    });
    const [nodes, setNodes] = useState<Node[]>([]);
    const [mapread, setMapread] = useState<ExportableNode[]>([]);
    const [center, setCenter] = useState<LatLngTuple>([0, 0]);
    const [borders, setBorders] = useState<LatLngTuple[]>([]);

    const nodesRequest = async () => {
        const response = await fetch(`${url}/v2/${simID}/frame/1`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        let result = await response.json();
        setMapread(result);
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
        setBorders([
            [result.lat1, result.lng1],
            [result.lat1, result.lng2],
            [result.lat2, result.lng2],
            [result.lat2, result.lng1],
            [result.lat1, result.lng1],
        ])
    };


    useEffect(() => {
        infoRequest();
        nodesRequest();
    }, []);

    useEffect(() => {
        const timerId = setInterval(
            async () => {
                await nodesRequest();
            },
            1000
        );
        return () => clearInterval(timerId);
    }, []);

    function getLevel(node: ExportableNode): number {
        let level = 0;
        node.contamination.forEach((stuff) => {
            level += stuff.levelOfContamination;
        })
        return level;
    }

    return (
        <div>
            <MapContainer center={center} zoom={3} scrollWheelZoom={true}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Polyline pathOptions={{color: "black"}} positions={borders}/>
                {mapread.map((exportnode) => {
                    return (
                        <Polygon
                            opacity={getLevel(exportnode)/10}
                            color={"red"}
                            positions={[
                                [exportnode.lat1, exportnode.lng1],
                                [exportnode.lat1, exportnode.lng2],
                                [exportnode.lat2, exportnode.lng2],
                                [exportnode.lat2, exportnode.lng1],
                            ]}
                        />
                    )
                })
                }
            </MapContainer>
            <input type={"range"} value={100} min={0} max={100} style={{width: 980}}/>
        </div>)
}
