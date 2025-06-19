import { useEffect } from 'react';

declare global {
    interface Window {
        frameworkReady?: () => void;
    }
}

export function useFrameworkReady() {
    useEffect(() => {
        window.frameworkReady?.();
    });
}
// This hook is used to signal that the framework is ready. It calls the `frameworkReady` function if it exists on the `window` object.
// This is useful for integrating with other libraries or frameworks that need to know when the framework is ready.