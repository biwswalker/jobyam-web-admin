import React, { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "../leaflet/dist/images/map-marker-icon-342x512-gd1hf1rz.png";
import markerIcon from "../leaflet/dist/images/map-marker-icon-342x512-gd1hf1rz.png";
import markerShadow from "../leaflet/dist/images/map-marker-icon-342x512-gd1hf1rz.png";
import { useLanguage1 } from "../context/LanguageContext";
import { motion } from "framer-motion";

interface MapSectionProps {
    lat: number;
    lng: number;
}

const MapSection: React.FC<MapSectionProps> = ({ lat, lng }) => {
    const { t } = useLanguage1();
    const [isClient, setIsClient] = useState(false);
    const [MapComponents, setMapComponents] = useState<{
        MapContainer: any;
        TileLayer: any;
        Marker: any;
        Popup: any;
    } | null>(null);
    const [L, setL] = useState<any>(null);

    useEffect(() => {
        setIsClient(true);
        // Dynamic import react-leaflet components (client side only)
        import("react-leaflet").then((module) => {
            setMapComponents({
                MapContainer: module.MapContainer,
                TileLayer: module.TileLayer,
                Marker: module.Marker,
                Popup: module.Popup,
            });
        });
        // Dynamic import leaflet
        import("leaflet").then((leafletModule) => {
            // กำหนด default icon ด้วยไฟล์ที่นำเข้า
            leafletModule.Icon.Default.mergeOptions({
                iconRetinaUrl: markerIcon2x,
                iconUrl: markerIcon,
                shadowUrl: markerShadow,
            });
            setL(leafletModule);
        });
    }, []);

    if (!isClient || !MapComponents || !L) return null;

    const { MapContainer, TileLayer, Marker, Popup } = MapComponents;
    // นิยาม customIcon โดยใช้ L.icon หลังจาก L ถูกโหลดแล้ว
    const customIcon = L.icon({
        iconRetinaUrl: "",
        iconUrl: markerIcon,
        shadowUrl: "",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    });

    // ใช้พิกัดจาก props
    const workplaceCoordinates: [number, number] = [lat, lng];

    return (
        <div className="mt-12 border-t pt-8 order-last w-full" style={{ zIndex: 1 }}>
            <h2 className="text-xl font-bold text-[#0038A8] mb-4 flex items-center">
                {t("mapSection.workplaceMap")}
                <motion.a
                    href={`https://www.google.com/maps/search/?api=1&query=${workplaceCoordinates[0]},${workplaceCoordinates[1]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 font-bold inline-flex items-center ml-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0z" />
                    </svg>
                    Google Map
                </motion.a>
            </h2>
            <div className="relative">
                <div className="rounded-lg overflow-hidden shadow-lg">
                    <MapContainer
                        center={workplaceCoordinates}
                        zoom={15}
                        scrollWheelZoom={false}
                        style={{ height: "400px", width: "100%" }}
                        className="z-0"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={workplaceCoordinates} icon={customIcon}>
                            <Popup>{t("mapSection.workplaceLocation")}</Popup>
                        </Marker>
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

export default MapSection;
