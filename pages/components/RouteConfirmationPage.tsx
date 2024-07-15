import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { GoogleMap, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import CircleMarker from './CircleMarker';

interface Location {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

const RouteConfirmationPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({ lat: 0, lng: 0 });
  const [routeMarkers, setRouteMarkers] = useState<google.maps.LatLngLiteral[]>([]);
  const router = useRouter();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  const mapOptions = useMemo(() => ({
    styles: [
      {
        elementType: "geometry",
        stylers: [{ color: "#F0F0F0" }], // Light grey land
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#E6E6E6" }], // Light grey water with same lightness as land
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#FFFFFF" }], // White roads
      },
      {
        featureType: "road",
        elementType: "labels",
        stylers: [{ visibility: "off" }], // Remove road labels
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#FFFFFF" }], // Keep only major roads
      },
      {
        featureType: "road.arterial",
        stylers: [{ color: "#FFFFFF" }], // Hide arterial roads
      },
      {
        featureType: "road.local",
        stylers: [{ color: "#FFFFFF" }], // Hide local roads
      },
      {
        featureType: "poi",
        stylers: [{ visibility: "off" }], // Remove points of interest
      },
      {
        featureType: "transit",
        stylers: [{ visibility: "off" }], // Remove transit lines
      },
      {
        featureType: "administrative",
        stylers: [{ visibility: "off" }], // Remove administrative lines
      },
      {
        elementType: "labels",
        stylers: [{ visibility: "off" }], // Remove all remaining labels
      },
    ],
    disableDefaultUI: true, // Remove all default UI elements
  }), []);

  useEffect(() => {
    if (typeof window !== 'undefined' && router.query.locations) {
      try {
        const parsedLocations = JSON.parse(router.query.locations as string) as Location[];
        setLocations(parsedLocations);
        if (parsedLocations.length > 0) {
          setMapCenter({ lat: parsedLocations[0].lat, lng: parsedLocations[0].lng });
        }
      } catch (error) {
        console.error("Failed to parse locations:", error);
        setLocations([]);
      }
    }
  }, [router.query.locations]);

  const updateDirections = useCallback(() => {
    if (isLoaded && locations.length >= 2) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: locations[0].address,
          destination: locations[locations.length - 1].address,
          waypoints: locations.slice(1, -1).map(location => ({ location: location.address, stopover: true })),
          travelMode: google.maps.TravelMode.WALKING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            
            // Extract marker positions from the route
            const markers = result.routes[0].legs.map(leg => leg.start_location.toJSON());
            markers.push(result.routes[0].legs[result.routes[0].legs.length - 1].end_location.toJSON());
            setRouteMarkers(markers);
          } else {
            console.error("Directions request failed. Status:", status);
          }
        }
      );
    }
  }, [isLoaded, locations]);

  useEffect(() => {
    updateDirections();
  }, [updateDirections]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(locations);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setLocations(items);
  };

  const handleConfirm = () => {
    router.push({
      pathname: '/map',
      query: { locations: JSON.stringify(locations) },
    });
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-[100dvh]">
      <div className="flex-1">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={mapCenter}
          zoom={10}
          options={mapOptions}
        >
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: "#000000",
                  strokeWeight: 4,
                  strokeOpacity: 0.7,
                },
              }}
            />
          )}
          {routeMarkers.map((position, index) => (
            <CircleMarker
              key={index}
              position={position}
              number={index + 1}
            />
          ))}
        </GoogleMap>
      </div>

      <div className="bg-white p-4">
        <h3 className="text-xl font-bold mb-2">Confirm Your Route</h3>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="locations">
            {(provided) => (
              <ul {...provided.droppableProps} ref={provided.innerRef}>
                {locations.map((location, index) => (
                  <Draggable key={location.name} draggableId={location.name} index={index}>
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-gray-100 p-2 mb-2 rounded flex items-center"
                      >
                        <div 
                          className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center mr-2"
                          style={{minWidth: '24px'}}
                        >
                          {index + 1}
                        </div>
                        {location.name}
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
        <button
          onClick={handleConfirm}
          className="mt-4 bg-yellow-400 text-black rounded-full px-4 py-2"
        >
          Confirm and View in 3D
        </button>
      </div>
    </div>
  );
};

export default RouteConfirmationPage;