module.exports = {
  content: [
    "./app/views/**/*.html.erb",
    "./app/helpers/**/*.rb",
    "./app/assets/stylesheets/**/*.css",
    "./app/javascript/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#1E40AF",
          700: "#1d4ed8",
          800: "#1E40AF",
          900: "#1e3a8a"
        }
      }
    }
  },
  plugins: []
}
