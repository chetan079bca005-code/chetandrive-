/** @type {import('tailwindcss').Config} */
module.exports = {
  // Add NativeWind preset
  presets: [require('nativewind/preset')],
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ChetanDrive-inspired color palette
        primary: {
          DEFAULT: '#FFDE00', // ChetanDrive Yellow
          dark: '#E5C700',
          light: '#FFF176',
        },
        secondary: {
          DEFAULT: '#1A1A1A', // Dark black
          light: '#333333',
        },
        accent: {
          DEFAULT: '#FF6B35', // Orange accent
          light: '#FF8A5B',
        },
        success: {
          DEFAULT: '#4CAF50',
          light: '#81C784',
        },
        danger: {
          DEFAULT: '#F44336',
          light: '#E57373',
        },
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
      },
      fontFamily: {
        regular: ['Inter-Regular'],
        medium: ['Inter-Medium'],
        semibold: ['Inter-SemiBold'],
        bold: ['Inter-Bold'],
      },
    },
  },
  plugins: [],
}
