declare global {
    namespace NodeJS {
        interface ProcessEnv {
            EXPO_PUBLIC_API_URL: string;
            EXPO_PUBLIC_API_KEY: string;
        }
    }
}

// Ensure this file is treated as a module
export { };
// This file is used to define the types for the environment variables used in the project.
// It ensures that the environment variables are available in the NodeJS process.