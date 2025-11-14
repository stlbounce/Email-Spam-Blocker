import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
import tailwindcss from '@tailwindcss/vite'
>>>>>>> Stashed changes
=======
import tailwindcss from '@tailwindcss/vite'
>>>>>>> Stashed changes

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
    tailwindcss(),
>>>>>>> Stashed changes
=======
    tailwindcss(),
>>>>>>> Stashed changes
  ],
})
