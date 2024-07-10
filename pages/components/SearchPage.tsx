import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useJsApiLoader } from '@react-google-maps/api';

const SearchPage: React.FC = () => {
  const [locations, setLocations] = useState<{name: string, address: string}[]>([]);
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
          fields: ['name', 'formatted_address'],
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
            const place = results[0];
            setLocations(prevLocations => {
              const newLocation = {
                name: place.name || '',
                address: place.formatted_address || ''
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
        pathname: '/map',
        query: { locations: JSON.stringify(locations) },
      });
    } else {
      alert('Please add at least two locations.');
    }
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <div className="flex-1 bg-yellow-400 p-4 rounded-b-3xl">
        <h2 className="text-3xl font-bold mb-4 text-black">Where did you visit?</h2>
        <form onSubmit={handleLocationSubmit} className="mb-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search"
              className="w-full bg-white text-black border-none rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
              onChange={handleInputChange}
              autoComplete="off"
            />
            <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black text-xl">
              &gt;
            </button>
          </div>
        </form>
        {predictions.map((prediction) => (
          <div
            key={prediction.place_id}
            className="py-1 px-2 hover:bg-yellow-300 cursor-pointer text-black"
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.value = prediction.description;
                handleLocationSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
              }
            }}
          >
            <div>{prediction.structured_formatting.main_text}</div>
            <div className="text-sm text-gray-600">
              {prediction.structured_formatting.secondary_text}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-black p-4">
        {locations.map((location, index) => (
          <div key={index} className="bg-gray-800 text-white rounded-full px-3 py-1 mb-2 flex items-center">
            <span className="mr-2">{location.name}</span>
            <button
              onClick={() => setLocations(prevLocations => prevLocations.filter((_, i) => i !== index))}
              className="text-red-500"
            >
              &times;
            </button>
          </div>
        ))}
        <button
          onClick={handleSearch}
          className="mt-4 bg-yellow-400 text-black rounded-full w-12 h-12 flex items-center justify-center"
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default SearchPage;