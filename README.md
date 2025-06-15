# 🏙️ Home Zone Analyzer

**Home Zone Analyzer** is a platform designed to help users identify the best property to purchase in the city of Bologna, based on their personal preferences.
Users are asked to fill out a questionnaire specifying the features their ideal property should have.
Once completed, they can interact with a map to select markers and polygons near the areas where they are interested in buying.
Home Zone Analyzer then assigns a score to each area or property:
the higher the score, the better the match with the preferences expressed in the questionnaire.

---

## 📌 Key Features

- Visualize data layers like green spaces, hospitals, theaters, Wi-Fi zones, bus stops, etc.
- Analyze city zones interactively based on customizable filters
- Load and serve GeoJSON data dynamically from the backend
- Use PostgreSQL with PostGIS for geographic data queries
- Fully containerized with Docker and Kubernetes support

---

## ⚙️ Technologies Used

- **Angular**
- **Node.js** / Express.js
- **PostgreSQL** + **PostGIS**
- **Docker**, **Docker Compose**
- **Kubernetes**


---

## 🌍 Data Layers

The app uses open datasets in GeoJSON format for the city of **Bologna**, including:

- Green areas 
- Museums, libraries, cinemas, theaters
- Hospitals and sports centers
- Bus stops and train stations
- Public Wi-Fi spots
- City districts

You can find the following data at: https://opendata.comune.bologna.it/pages/home/

---

## 🚀 Getting Started (Local)

1. **Clone the repo**  
```bash
git clone https://github.com/JackSagliano/Home-Zone-Analyzer.git
cd Home-Zone-Analyzer
```
2. **Install the dependencies**
```bash
cd backend
npm install
```
4. **Start with Docker Compose**
```bash
docker-compose up --build
```

4. **Access the app via**
```bash
http://localhost:30080
```
