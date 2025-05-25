import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useJsApiLoader } from '@react-google-maps/api';
import { ArrowRight } from 'lucide-react';
import BackButton from '../src/components/common/BackButton';

export default function Search() {
  const [locations, setLocations] = useState<{name: string, address: string, lat: number, lng: number}[]>([]);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (isLoaded && !loadError) {
      setAutocompleteService(new google.maps.places.AutocompleteService());
      setPlacesService(new google.maps.places.PlacesService(document.createElement('div')));
    }
  }, [isLoaded, loadError]);

  const handleLocationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = inputRef.current?.value;
    if (input && placesService) {
      placesService.findPlaceFromQuery(
        {
          query: input,
          fields: ['name', 'formatted_address', 'geometry'],
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
            const place = results[0];
            setLocations(prevLocations => {
              const newLocation = {
                name: place.name || '',
                address: place.formatted_address || '',
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0
              };
              return newLocation.name ? [...prevLocations, newLocation] : prevLocations;
            });
            if (inputRef.current) {
              inputRef.current.value = '';
            }
            setPredictions([]);
          } else {
            alert('Please select a valid location from the suggestions.');
          }
        }
      );
    } else {
      alert('Please enter a location.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (input && autocompleteService) {
      autocompleteService.getPlacePredictions(
        { input, types: ['establishment'] },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
          } else {
            setPredictions([]);
          }
        }
      );
    } else {
      setPredictions([]);
    }
  };

  const handleSearch = () => {
    if (locations.length >= 2) {
      router.push({
        pathname: '/routes/routeConfirmation',
        query: { locations: JSON.stringify(locations) },
      });
    } else {
      alert('Please add at least two locations.');
    }
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-[100dvh] bg-stone-900 text-stone-100">
      <div className="flex-1 bg-stone-200 p-4 overflow-auto">
        <h2 className="text-2xl font-semibold my-4 text-stone-900">Where did you visit?</h2>
        <form onSubmit={handleLocationSubmit} className="mb-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search"
              className="w-full bg-stone-100 text-stone-900 border-none rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-stone-400"
              onChange={handleInputChange}
              autoComplete="off"
            />
            <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-900">
              <ArrowRight size={20} />
            </button>
          </div>
        </form>
        {predictions.map((prediction) => (
          <div
            key={prediction.place_id}
            className="py-1 px-2 hover:bg-stone-300 cursor-pointer text-stone-900"
            onClick={() => {
              if (placesService && inputRef.current) {
                placesService.getDetails(
                  {
                    placeId: prediction.place_id,
                    fields: ['name', 'formatted_address', 'geometry']
                  },
                  (place, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && place && inputRef.current) {
                      setLocations(prevLocations => {
                        const newLocation = {
                          name: place.name || '',
                          address: place.formatted_address || '',
                          lat: place.geometry?.location?.lat() || 0,
                          lng: place.geometry?.location?.lng() || 0
                        };
                        return newLocation.name ? [...prevLocations, newLocation] : prevLocations;
                      });
                      inputRef.current.value = '';
                      setPredictions([]);
                    }
                  }
                );
              }
            }}
          >
            <div>{prediction.structured_formatting.main_text}</div>
            <div className="text-sm text-stone-600">
              {prediction.structured_formatting.secondary_text}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-stone-900 p-4 w-full">
        {locations.map((location, index) => (
          <div key={index} className="bg-stone-800 text-stone-100 rounded-full px-3 py-1 mb-2 flex items-center">
            <span className="mr-2">{location.name}</span>
            <button
              onClick={() => setLocations(prevLocations => prevLocations.filter((_, i) => i !== index))}
              className="text-stone-500"
            >
              &times;
            </button>
          </div>
        ))}
        <div className="w-full flex items-center justify-center">
          <button
            onClick={handleSearch}
            className="mt-4 bg-stone-200 text-stone-900 rounded-full w-12 h-12 flex items-center justify-center"
          >
            <ArrowRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
} 