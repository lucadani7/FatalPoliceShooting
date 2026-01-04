"use client";
import {useEffect} from 'react';
import {MapContainer, Marker, Popup, TileLayer, useMap} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import {Database} from '@/types/supabase';

type Incident = Database['public']['Tables']['incidents']['Row'];

function RecenterMap({incidents}: { incidents: Incident[] }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !map.getContainer()) return;

        if (incidents.length <= 0) {
            map.setView([37.8, -96], 4);
        } else {
            const points = incidents
                .filter(i => i.latitude !== null && i.longitude !== null)
                .map(i => L.latLng(Number(i.latitude), Number(i.longitude)));

            if (points.length > 0) {
                const bounds = L.latLngBounds(points);
                map.invalidateSize();
                map.fitBounds(bounds, {padding: [50, 50], maxZoom: 7});
            }
        }
    }, [incidents, map]);

    return null;
}

export default function Maps({incidents}: { incidents: Incident[] }) {
    const center: [number, number] = [37.8, -96];

    return (
        <div className="card" style={{
            height: '500px',
            width: '100%',
            padding: '0',
            overflow: 'hidden',
            position: 'relative',
            borderRadius: '16px'
        }}>
            <MapContainer
                center={center}
                zoom={4}
                style={{height: '100%', width: '100%'}}
                trackResize={true}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap'
                />

                <RecenterMap incidents={incidents}/>

                <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
                    {incidents
                        .filter(i => i.latitude !== null && i.longitude !== null)
                        .map((incident, idx) => (
                            <Marker
                                key={incident.id || idx}
                                position={[Number(incident.latitude), Number(incident.longitude)]}
                                icon={L.icon({
                                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                                    iconSize: [25, 41],
                                    iconAnchor: [12, 41],
                                })}
                            >
                                <Popup>
                                    <div style={{fontFamily: 'sans-serif'}}>
                                        <strong style={{fontSize: '14px'}}>{incident.name || 'Unknown'}</strong><br/>
                                        <span style={{color: '#64748b'}}>{incident.city}, {incident.state}</span>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                </MarkerClusterGroup>
            </MapContainer>
        </div>
    );
}