import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useMapEvents } from 'react-leaflet';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

/**
 * Componente para seleção de coordenadas no mapa
 * Permite arrastar marcador ou clicar no mapa para definir posição
 */
const MapPicker = ({ initialLatLng = null, onPick }) => {
  // Centro padrão em João Monlevade-MG
  const defaultCenter = [-19.8108, -43.1756];
  const [position, setPosition] = useState(initialLatLng || defaultCenter);
  const [inputLat, setInputLat] = useState(initialLatLng ? initialLatLng[0].toString() : '');
  const [inputLng, setInputLng] = useState(initialLatLng ? initialLatLng[1].toString() : '');
  const markerRef = useRef(null);

  // Componente interno para capturar eventos do mapa
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        setInputLat(lat.toFixed(6));
        setInputLng(lng.toFixed(6));
      },
    });
    return null;
  };

  // Atualizar posição quando inputs mudarem
  const handleInputChange = (type, value) => {
    if (type === 'lat') {
      setInputLat(value);
      const lat = parseFloat(value);
      if (!isNaN(lat) && lat >= -90 && lat <= 90) {
        setPosition([lat, position[1]]);
      }
    } else {
      setInputLng(value);
      const lng = parseFloat(value);
      if (!isNaN(lng) && lng >= -180 && lng <= 180) {
        setPosition([position[0], lng]);
      }
    }
  };

  // Validar coordenadas
  const isValidCoordinates = () => {
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);
    return (
      !isNaN(lat) && !isNaN(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    );
  };

  // Usar coordenadas selecionadas
  const handleUseCoordenates = () => {
    if (isValidCoordinates() && onPick) {
      onPick(parseFloat(inputLat), parseFloat(inputLng));
    }
  };

  // Criar ícone customizado para o marcador
  const createDraggableIcon = () => {
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      return new L.DivIcon({
        className: 'custom-draggable-marker',
        html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); cursor: move;"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    }
    return null;
  };

  // Atualizar posição quando marcador for arrastado
  const handleMarkerDrag = () => {
    const marker = markerRef.current;
    if (marker) {
      const { lat, lng } = marker.getLatLng();
      setPosition([lat, lng]);
      setInputLat(lat.toFixed(6));
      setInputLng(lng.toFixed(6));
    }
  };

  return (
    <div className="space-y-4">
      {/* Mapa */}
      <div className="h-80 w-full border border-gray-300 rounded-lg overflow-hidden">
        <MapContainer
          center={position}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapEvents />
          <Marker
            position={position}
            draggable={true}
            icon={createDraggableIcon()}
            ref={markerRef}
            eventHandlers={{
              dragend: handleMarkerDrag,
            }}
          />
        </MapContainer>
      </div>

      {/* Inputs para coordenadas */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Latitude
          </label>
          <input
            type="number"
            step="0.000001"
            min="-90"
            max="90"
            value={inputLat}
            onChange={(e) => handleInputChange('lat', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="-19.8108"
          />
          {inputLat && (isNaN(parseFloat(inputLat)) || parseFloat(inputLat) < -90 || parseFloat(inputLat) > 90) && (
            <p className="text-xs text-red-500 mt-1">Latitude deve estar entre -90 e 90</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Longitude
          </label>
          <input
            type="number"
            step="0.000001"
            min="-180"
            max="180"
            value={inputLng}
            onChange={(e) => handleInputChange('lng', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="-43.1756"
          />
          {inputLng && (isNaN(parseFloat(inputLng)) || parseFloat(inputLng) < -180 || parseFloat(inputLng) > 180) && (
            <p className="text-xs text-red-500 mt-1">Longitude deve estar entre -180 e 180</p>
          )}
        </div>
      </div>

      {/* Instruções */}
      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
        <p className="font-medium mb-1">Como usar:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Clique no mapa para posicionar o marcador</li>
          <li>Arraste o marcador vermelho para ajustar a posição</li>
          <li>Digite as coordenadas diretamente nos campos acima</li>
          <li>Clique em "Usar estas coordenadas" para confirmar</li>
        </ul>
      </div>

      {/* Botão para usar coordenadas */}
      <div className="flex justify-end">
        <button
          onClick={handleUseCoordenates}
          disabled={!isValidCoordinates()}
          className={`px-4 py-2 rounded-md font-medium ${
            isValidCoordinates()
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Usar estas coordenadas
        </button>
      </div>
    </div>
  );
};

export default MapPicker;