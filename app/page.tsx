"use client"

import Head from 'next/head';
import React from 'react';
import {
  useEffect,
  useState,
  useRef
} from 'react';
import mapboxgl, {
  GeoJSONFeature,
  MapMouseEvent,
} from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import BuildingInfo from '@/components/ui/BuildingInfo';
import { Slider } from '@/components/ui/slider';

export default function Home() {
  // features state is for BuildingInfo component
  const [features, setFeatures] = useState<GeoJSONFeature[] | null>(null)

  // heightValue state is for changing height through slider
  const [heightValue, setHeightValue] = useState<number>(0);

  // mapRef is used to store information about map,
  // so I could divide user interactions with map into different functions
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Set the Mapbox access token
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOXGL_TOKEN ?? '';

  useEffect(() => {
    // Creates a new map
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-74.5, 40],
      zoom: 9,
    });

    // using useRef here so I can divide code into smaller functions
    // and access map
    mapRef.current = map;

    // On load - resizes map and Insert a layer beneath any symbol layer
    map.on('load', () => {
      map.resize();

      const layers = map.getStyle()!.layers;
      const labelLayerId = layers.find(
        (layer) => layer.type === 'symbol' && layer.layout!['text-field']
      )?.id;

      map.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'height'],
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'min_height'],
          ],
          'fill-extrusion-opacity': 0.6,
        },
      },
        labelLayerId
      );
    });

    // User selects 3d model of building(s) by pressing on them
    // When user selects them - they change color to red
    map.on('click', '3d-buildings', (e: MapMouseEvent) => {
      selectBuildings(e);
    });

    return () => {
      if (mapRef.current) mapRef.current.remove();
    };
  }, []);

  // Function to select building(s) based on mouse click
  function selectBuildings(e: MapMouseEvent) {
    // accesses map through mapRef defined in the first useEffect
    const map = mapRef.current;
    if (!map) return;

    const features = map.queryRenderedFeatures(e.point, {
      layers: ['3d-buildings'],
    });

    if (!features.length) return;

    setFeatures(features);

    // Before selecting new building(s)
    // Clears previously selected
    map.removeFeatureState({ source: 'composite', sourceLayer: 'building' });

    // Set feature state for interaction
    features.forEach((feature) => {
      // declaring featureId fixes type error inside map.setFeatureState()
      const featureId = feature.id as string | number;
      map.setFeatureState(
        { source: 'composite', sourceLayer: 'building', id: featureId },
        { selected: true }
      );
    })

    // Update the color of the selected building
    map.setPaintProperty('3d-buildings', 'fill-extrusion-color', [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      '#f00', // Selected color
      '#aaa', // Default color
    ]);
  }

  // This function changes selected building height
  // based on slider value.
  function updateBuildingHeight(newHeightValue: number) {
    // accesses map through mapRef defined in the first useEffect
    const map = mapRef.current;
    if (!map) return;

    const selectedFeatures = map.queryRenderedFeatures(undefined, { layers: ['3d-buildings'] })
      .filter(feature => feature.state!.selected);

    selectedFeatures.forEach(feature => {
      // declaring featureId fixes type error inside map.setFeatureState()
      const featureId = feature.id as string | number;
      map.setFeatureState(
        { source: 'composite', sourceLayer: 'building', id: featureId },
        { height: feature.properties!.height + newHeightValue }
      );

      map.setPaintProperty('3d-buildings', 'fill-extrusion-height', [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        ['+', ['get', 'height'], newHeightValue],
        ['get', 'height'],
      ]);
    });
  };

  // Call updateBuildingHeight when slider value changes
  useEffect(() => {
    updateBuildingHeight(heightValue);
  }, [heightValue]);

  return (
    <>
      <Head>
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css"
          rel="stylesheet"
        />
      </Head>
      <main className="flex min-h-screen">
        <div id="map" className="h-screen w-screen" />
        <div className='flex flex-col min-w-96 gap-5 p-5 items-center absolute bottom-0 left-1/2 transform -translate-x-1/2'>
          <BuildingInfo features={features} />
          <span>Height:</span>
          <Slider defaultValue={[heightValue]} max={100} step={1} onValueChange={(value) => setHeightValue(value[0])} title='Height' />
        </div>
      </main>
    </>
  );
}
