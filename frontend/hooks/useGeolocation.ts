'use client';

import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
    coords: { latitude: number; longitude: number } | null;
    error: string | null;
    loading: boolean;
}

export function useGeolocation() {
    const [state, setState] = useState<GeolocationState>({
        coords: null,
        error: null,
        loading: false,
    });

    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setState({
                coords: null,
                error: 'Geolocation is not supported by your browser.',
                loading: false,
            });
            return;
        }

        setState((prev) => ({ ...prev, loading: true, error: null }));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setState({
                    coords: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    },
                    error: null,
                    loading: false,
                });
            },
            (error) => {
                let errorMessage = 'Unable to retrieve your location.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please enable GPS or select a delivery location manually.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable. Please select a delivery location manually.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out. Please try again or select manually.';
                        break;
                }
                setState({
                    coords: null,
                    error: errorMessage,
                    loading: false,
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            }
        );
    }, []);

    return {
        ...state,
        requestLocation,
    };
}
